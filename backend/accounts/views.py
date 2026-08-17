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
from django.db.models import Q

from .models import User, TeacherProfile, StudentProfile, ParentProfile, ParentLinkRequest
from .serializers import (
    UserSerializer, TeacherProfileSerializer,
    StudentProfileSerializer, ParentProfileSerializer,
    RegisterSerializer, ParentLinkRequestSerializer
)


ACTIVE_SUBSCRIPTION_EVENTS = {'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'}
INACTIVE_SUBSCRIPTION_EVENTS = {'EXPIRATION'}

STORE_TO_PLATFORM = {
    'APP_STORE': 'app_store',
    'MAC_APP_STORE': 'app_store',
    'PLAY_STORE': 'play_store',
    'STRIPE': 'stripe',
    'RC_BILLING': 'stripe',
}


class RevenueCatWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        auth_header = request.headers.get('Authorization', '')
        expected = f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"
        if not settings.REVENUECAT_WEBHOOK_SECRET or auth_header != expected:
            return Response({"error": "Yetkisiz istek."}, status=status.HTTP_401_UNAUTHORIZED)

        event = request.data.get('event', {})
        event_type = event.get('type')
        app_user_id = event.get('app_user_id')

        if not app_user_id or not app_user_id.isdigit():
            return Response({"status": "ignored"}, status=status.HTTP_200_OK)

        try:
            profile = TeacherProfile.objects.get(user_id=int(app_user_id))
        except TeacherProfile.DoesNotExist:
            return Response({"status": "ignored"}, status=status.HTTP_200_OK)

        profile.revenuecat_app_user_id = app_user_id
        store = event.get('store')
        if store:
            profile.subscription_platform = STORE_TO_PLATFORM.get(store, store.lower())

        expiration_ms = event.get('expiration_at_ms')
        if expiration_ms:
            from datetime import datetime, timezone as dt_timezone
            profile.subscription_expires_at = datetime.fromtimestamp(expiration_ms / 1000, tz=dt_timezone.utc)

        if event_type in ACTIVE_SUBSCRIPTION_EVENTS:
            profile.is_subscribed = True
        elif event_type in INACTIVE_SUBSCRIPTION_EVENTS:
            profile.is_subscribed = False

        profile.save(update_fields=['revenuecat_app_user_id', 'subscription_platform', 'subscription_expires_at', 'is_subscribed'])
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


LEMONSQUEEZY_ACTIVE_STATUSES = {'active', 'on_trial'}


class LemonSqueezyWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import hmac
        import hashlib

        signature = request.headers.get('X-Signature', '')
        secret = settings.LEMONSQUEEZY_WEBHOOK_SECRET
        if not secret:
            return Response({"error": "Yapılandırılmamış."}, status=status.HTTP_401_UNAUTHORIZED)

        digest = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(digest, signature):
            return Response({"error": "Geçersiz imza."}, status=status.HTTP_401_UNAUTHORIZED)

        payload = request.data
        user_id = payload.get('meta', {}).get('custom_data', {}).get('user_id')
        if not user_id:
            return Response({"status": "ignored"}, status=status.HTTP_200_OK)

        try:
            profile = TeacherProfile.objects.get(user_id=int(user_id))
        except (TeacherProfile.DoesNotExist, ValueError, TypeError):
            return Response({"status": "ignored"}, status=status.HTTP_200_OK)

        attributes = payload.get('data', {}).get('attributes', {})
        sub_status = attributes.get('status')
        ends_at = attributes.get('renews_at') or attributes.get('ends_at')

        profile.subscription_platform = 'lemonsqueezy'
        profile.is_subscribed = sub_status in LEMONSQUEEZY_ACTIVE_STATUSES
        if ends_at:
            from django.utils.dateparse import parse_datetime
            parsed = parse_datetime(ends_at)
            if parsed:
                profile.subscription_expires_at = parsed

        profile.save(update_fields=['subscription_platform', 'is_subscribed', 'subscription_expires_at'])
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        user = request.user

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

        if request.method in ['PATCH', 'PUT']:
            if user.role == 'TEACHER':
                profile = TeacherProfile.objects.get_or_create(user=user)[0]
                serializer = TeacherProfileSerializer(profile, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response({"detail": "Sadece öğretmenler profil güncelleyebilir."}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def my_students(self, request):
        user = request.user

        if user.role == 'TEACHER':
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
    serializer_class = TeacherProfileSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return TeacherProfile.objects.select_related('user').filter(
            Q(is_subscribed=True) | Q(subscription_exempt=True),
            is_verified=True,
        )

class TeacherDetailView(generics.RetrieveAPIView):
    queryset = TeacherProfile.objects.all()
    serializer_class = TeacherProfileSerializer
    permission_classes = []

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.teacher_profile

    def perform_update(self, serializer):
        instance = serializer.save()
        if 'diploma_document' in self.request.FILES:
            instance.verification_status = 'PENDING'
            instance.is_verified = False
            instance.save(update_fields=['verification_status', 'is_verified'])


class TeacherVerificationListView(generics.ListAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = TeacherProfile.objects.select_related('user').all().order_by('-id')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(verification_status=status_param.upper())
        return qs


class TeacherVerificationReviewView(generics.GenericAPIView):
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


class TeacherSubscriptionOverrideView(generics.GenericAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdmin]
    queryset = TeacherProfile.objects.all()

    def patch(self, request, pk):
        try:
            profile = TeacherProfile.objects.get(pk=pk)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Öğretmen profili bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        exempt = request.data.get('subscription_exempt')
        if not isinstance(exempt, bool):
            return Response({"detail": "'subscription_exempt' alanı true/false olmalı."}, status=status.HTTP_400_BAD_REQUEST)

        profile.subscription_exempt = exempt
        profile.save(update_fields=['subscription_exempt'])

        return Response(TeacherProfileSerializer(profile).data)


class ParentLinkRequestListView(generics.ListAPIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
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
