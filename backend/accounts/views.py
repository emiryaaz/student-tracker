from rest_framework import viewsets, status, generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import User, TeacherProfile, StudentProfile, ParentProfile
from .serializers import (
    UserSerializer, TeacherProfileSerializer,
    StudentProfileSerializer, ParentProfileSerializer,
    RegisterSerializer
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
        """Veli, öğrencisinin e-posta adresini girerek onu kendi hesabına bağlar"""
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

        student_profile.parent = parent_profile
        student_profile.save()

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