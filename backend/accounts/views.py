from rest_framework import viewsets, status, generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .models import User, TeacherProfile, StudentProfile, ParentProfile, ParentLinkRequest
from .serializers import (
    UserSerializer, TeacherProfileSerializer,
    StudentProfileSerializer, ParentProfileSerializer,
    RegisterSerializer, ParentLinkRequestSerializer
)


class IsAdmin(permissions.BasePermission):
    """Yalnızca ADMIN rolündeki kullanıcıların erişimine izin verir (öğretmen doğrulama
    onay/red işlemleri gibi hassas admin işlemleri için)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class ProfileViewSet(viewsets.ViewSet):
    """
    Kullanıcıların kendi profil bilgilerini ve 
    öğretmenlerin kendi öğrencilerini görebileceği genel ViewSet.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        """Kullanıcının kendi rolüne uygun profil verisini döner veya günceller"""
        user = request.user
        
        # 1. GET İsteği (Profil Bilgilerini Getir)
        if request.method == 'GET':
            if user.role == 'TEACHER':
                profile = TeacherProfile.objects.get_or_create(user=user)[0]
                serializer = TeacherProfileSerializer(profile)
            elif user.role == 'STUDENT':
                profile = StudentProfile.objects.get_or_create(user=user)[0]
                serializer = StudentProfileSerializer(profile)
            elif user.role == 'PARENT':
                profile = ParentProfile.objects.get_or_create(user=user)[0]
                serializer = ParentProfileSerializer(profile)
            else:
                serializer = UserSerializer(user)
            return Response(serializer.data)

        # 2. PATCH/PUT İsteği (Profil Bilgilerini Güncelle)
        if request.method in ['PATCH', 'PUT']:
            if user.role == 'TEACHER':
                profile = TeacherProfile.objects.get_or_create(user=user)[0]
                # data=request.data kullanıyoruz ki FormData ile gelen resimleri okuyabilsin
                serializer = TeacherProfileSerializer(profile, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({"detail": "Sadece öğretmenler profil güncelleyebilir."}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def my_students(self, request):
        """Eğer kullanıcı öğretmense veya veliyse onlara bağlı öğrencileri listeler"""
        user = request.user
        
        if user.role == 'TEACHER':
            # DÜZELTME: Burada yanlışlıkla kullanılmayan 'education' app'indeki Enrollment
            # tablosu sorgulanıyordu (enrollments__teacher__user), o tablo hiçbir yerde
            # doldurulmadığı için bu her zaman boş dönerdi. Gerçek öğretmen-öğrenci bağlantısı
            # school.TutoringRelation'da tutuluyor (related_name='tutors_list').
            students = StudentProfile.objects.filter(tutors_list__tutor__user=user, tutors_list__is_active=True).distinct()
            serializer = StudentProfileSerializer(students, many=True)
            return Response(serializer.data)
            
        elif user.role == 'PARENT':
            students = StudentProfile.objects.filter(parent__user=user)
            serializer = StudentProfileSerializer(students, many=True)
            return Response(serializer.data)
            
        return Response(
            {"detail": "Bu işlemi yapmaya yetkiniz yok."}, 
            status=status.HTTP_403_FORBIDDEN
        )

    @action(detail=False, methods=['post'])
    def link_child(self, request):
        """Veli, öğrencisinin e-posta adresini girer; bu ARTIK doğrudan bağlamaz, öğrenciye
        bir bağlantı TALEBİ gönderir. Öğrenci bunu kendi panelinden kabul/red edebilir.
        Eskiden burası anında bağlıyordu: yani herhangi bir veli, sadece bir öğrencinin
        e-postasını bilerek onun ödev/sınav/kaynak verilerine öğrencinin haberi bile olmadan
        erişebiliyordu. Onay adımı bu güvenlik açığını kapatır."""
        user = request.user
        if user.role != 'PARENT':
            return Response({"detail": "Sadece veliler öğrenci bağlayabilir."}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('student_email', '').strip().lower()
        if not email:
            return Response({"detail": "Öğrenci e-postası gerekli."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(email__iexact=email, role='STUDENT')
        except User.DoesNotExist:
            return Response({"detail": "Bu e-postaya sahip bir öğrenci bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        student_profile, _ = StudentProfile.objects.get_or_create(user=student_user)
        parent_profile, _ = ParentProfile.objects.get_or_create(user=user)

        if student_profile.parent_id == parent_profile.id:
            return Response({"detail": "Bu öğrenci zaten hesabınıza bağlı."}, status=status.HTTP_400_BAD_REQUEST)

        existing = ParentLinkRequest.objects.filter(parent=parent_profile, student=student_profile, status='PENDING')
        if existing.exists():
            return Response({"detail": "Bu öğrenciye zaten cevap bekleyen bir bağlantı talebiniz var."}, status=status.HTTP_400_BAD_REQUEST)

        link_request = ParentLinkRequest.objects.create(parent=parent_profile, student=student_profile)

        return Response(ParentLinkRequestSerializer(link_request).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def unlink_child(self, request):
        """Veli, hesabına bağlı bir öğrenciyi kendi isteğiyle kaldırabilir (örn. yanlış
        öğrenci bağlanmışsa)."""
        user = request.user
        if user.role != 'PARENT':
            return Response({"detail": "Sadece veliler öğrenci bağlantısını kaldırabilir."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get('student_id')
        parent_profile = ParentProfile.objects.filter(user=user).first()
        if not parent_profile:
            return Response({"detail": "Veli profili bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        student_profile = StudentProfile.objects.filter(id=student_id, parent=parent_profile).first()
        if not student_profile:
            return Response({"detail": "Bu öğrenci zaten hesabınıza bağlı değil."}, status=status.HTTP_404_NOT_FOUND)

        student_profile.parent = None
        student_profile.save(update_fields=['parent'])

        return Response(ParentProfileSerializer(parent_profile).data, status=status.HTTP_200_OK)

class TeacherListView(generics.ListAPIView):
    # Sadece öğretmen profillerini ve bağlı oldukları kullanıcı bilgilerini çeker
    queryset = TeacherProfile.objects.select_related('user').all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [AllowAny] # Üye olmayanlar da vitrini görebilir

class TeacherDetailView(generics.RetrieveAPIView):
    queryset = TeacherProfile.objects.all() # Model ismin neyse onu yaz (örn: TeacherProfile veya Teacher)
    serializer_class = TeacherProfileSerializer # Serializer ismin
    permission_classes = [] # Herkesin profili görmesine izin ver

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated] # Sadece giriş yapanlar profilini güncelleyebilir

    def get_object(self):
        # PATCH veya GET isteği atan kişinin (kendi) profilini bulup döndürür
        # Eğer modelin User ile OneToOne bağlıysa ve related_name 'teacher_profile' ise:
        return self.request.user.teacher_profile

    def perform_update(self, serializer):
        instance = serializer.save()
        # Öğretmen yeni bir diploma/belge yüklediyse, önceki durum (onaylı olsa bile) artık
        # bu yeni belgeyi kapsamıyor demektir; admin'in tekrar incelemesi için PENDING'e
        # alıyoruz ve is_verified'ı sıfırlıyoruz. Böylece eski onaylı bir öğretmen, şüpheli
        # yeni bir belge yükleyip eski onayın arkasına saklanamaz.
        if 'diploma_document' in self.request.FILES:
            instance.verification_status = 'PENDING'
            instance.is_verified = False
            instance.save(update_fields=['verification_status', 'is_verified'])


class TeacherVerificationListView(generics.ListAPIView):
    """Admin paneli: doğrulama kuyruğu. ?status=PENDING gibi bir filtre verilmezse tüm
    öğretmenleri (en yeni başta) listeler."""
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = TeacherProfile.objects.select_related('user').all().order_by('-id')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(verification_status=status_param.upper())
        return qs


class TeacherVerificationReviewView(generics.GenericAPIView):
    """Admin paneli: bir öğretmenin diplomasını onaylar ya da reddeder. Öğretmenin
    is_verified/verification_status alanlarına dokunabilecek TEK uç burasıdır."""
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdmin]
    queryset = TeacherProfile.objects.all()

    def patch(self, request, pk):
        try:
            profile = TeacherProfile.objects.get(pk=pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen profili bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('APPROVED', 'REJECTED'):
            return Response({"detail": "Geçersiz durum. 'APPROVED' ya da 'REJECTED' olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        profile.verification_status = new_status
        profile.is_verified = (new_status == 'APPROVED')
        profile.verification_note = request.data.get('note', '')
        profile.save(update_fields=['verification_status', 'is_verified', 'verification_note'])

        return Response(TeacherProfileSerializer(profile).data)


class ParentLinkRequestListView(generics.ListAPIView):
    """Veli kendi gönderdiği, öğrenci ise kendisine gönderilen bağlantı taleplerini görür."""
    serializer_class = ParentLinkRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PARENT':
            return ParentLinkRequest.objects.filter(parent__user=user).order_by('-created_at')
        elif user.role == 'STUDENT':
            return ParentLinkRequest.objects.filter(student__user=user).order_by('-created_at')
        return ParentLinkRequest.objects.none()


class ParentLinkRequestRespondView(generics.GenericAPIView):
    """Öğrenci, kendisine gelen bir veli bağlantı talebini kabul eder ya da reddeder.
    StudentProfile.parent alanına dokunabilecek TEK uç burasıdır (öğrencinin rızası olmadan
    hiçbir veli bir öğrenciye bağlanamaz)."""
    serializer_class = ParentLinkRequestSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        if user.role != 'STUDENT':
            return Response({"detail": "Yalnızca öğrenciler bağlantı taleplerine yanıt verebilir."}, status=status.HTTP_403_FORBIDDEN)

        try:
            link_request = ParentLinkRequest.objects.get(pk=pk, student__user=user)
        except ParentLinkRequest.DoesNotExist:
            return Response({"detail": "Talep bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('ACCEPTED', 'REJECTED'):
            return Response({"detail": "Geçersiz durum. 'ACCEPTED' ya da 'REJECTED' olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        link_request.status = new_status
        link_request.save(update_fields=['status', 'updated_at'])

        if new_status == 'ACCEPTED':
            student_profile = link_request.student
            student_profile.parent = link_request.parent
            student_profile.save(update_fields=['parent'])

        return Response(ParentLinkRequestSerializer(link_request).data)


class PasswordResetRequestView(APIView):
    """Şifremi unuttum: e-posta ile sıfırlama linki gönderir. Geliştirmede EMAIL_BACKEND
    'console' olduğu için gerçek e-posta gitmez, link `docker compose logs web` çıktısında
    görünür (bkz. core/settings.py EMAIL_BACKEND açıklaması)."""
    permission_classes = [AllowAny]

    def post(self, request):
        # GÜVENLİK: Kayıtlı olmayan bir e-posta için farklı bir cevap dönersek, biri bu uca
        # rastgele e-postalar deneyerek "hangi e-postalar sistemde kayıtlı" diye tarayabilir
        # (user enumeration). Bu yüzden e-posta var da olsa yok da olsa AYNI cevabı dönüyoruz.
        generic_response = Response(
            {"detail": "Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi."},
            status=status.HTTP_200_OK
        )

        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return generic_response

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return generic_response

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}"

        send_mail(
            subject="EduTracker - Şifre Sıfırlama",
            message=(
                f"Merhaba {user.first_name},\n\n"
                f"Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n{reset_link}\n\n"
                "Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        return generic_response


class PasswordResetConfirmView(APIView):
    """Linkteki uid/token doğrulanır ve yeni şifre kaydedilir."""
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password', '')

        if not uidb64 or not token or not new_password:
            return Response({"detail": "Eksik bilgi."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({"detail": "Şifre en az 6 karakter olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Geçersiz bağlantı."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Bağlantının süresi dolmuş ya da geçersiz. Lütfen yeniden şifre sıfırlama isteği gönderin."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Şifreniz başarıyla güncellendi."}, status=status.HTTP_200_OK)