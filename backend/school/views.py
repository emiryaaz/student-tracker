from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import TutoringRelation, Assignment, ExamResult, Resource, Message, MatchRequest, CalendarEvent, TeacherReview
from .serializers import (TutoringRelationSerializer, AssignmentSerializer,
                          ExamResultSerializer, ResourceSerializer, MessageSerializer,MatchRequestSerializer,
                           CalendarEventSerializer, TeacherReviewSerializer)
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from accounts.models import TeacherProfile, StudentProfile, User

class TeacherStudentsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutoringRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TutoringRelation.objects.filter(tutor__user=self.request.user, is_active=True)

class BaseRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return self.queryset.filter(relation__tutor__user=user)
        elif user.role == 'STUDENT':
            return self.queryset.filter(relation__student__user=user)
        elif user.role == 'PARENT':
            return self.queryset.filter(relation__student__parent__user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler oluşturabilir.")
        relation = serializer.validated_data.get('relation')
        if not relation or relation.tutor.user != user:
            raise PermissionDenied("Yalnızca kendi öğrencileriniz için kayıt oluşturabilirsiniz.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler düzenleyebilir.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler silebilir.")
        instance.delete()

class AssignmentViewSet(BaseRoleViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'STUDENT':
            if set(serializer.validated_data.keys()) - {'status'}:
                raise PermissionDenied("Öğrenciler yalnızca ödev durumunu güncelleyebilir.")
            serializer.save()
        else:
            super().perform_update(serializer)

class ExamResultViewSet(BaseRoleViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer

class ResourceViewSet(BaseRoleViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        chat_user_id = self.request.query_params.get('user_id')

        if chat_user_id:
            Message.objects.filter(sender_id=chat_user_id, receiver=user, is_read=False).update(is_read=True)

            return Message.objects.filter(
                (Q(sender=user) & Q(receiver_id=chat_user_id)) |
                (Q(sender_id=chat_user_id) & Q(receiver=user))
            ).order_by('timestamp')

        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class UnreadMessageCountView(APIView):
    def get(self, request):
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread_count': count})

class MatchRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MatchRequestSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'PARENT':
            return MatchRequest.objects.filter(
                student__student_profile__parent__user=user
            ).order_by('-created_at')

        return MatchRequest.objects.filter(
            Q(teacher=user) | Q(student=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == 'STUDENT':
            target_student = user
        elif user.role == 'PARENT':
            student_id = serializer.validated_data.get('student_id')
            if not student_id:
                raise ValidationError({"student_id": "Lütfen talebi hangi öğrenciniz için gönderdiğinizi seçin."})
            is_own_child = StudentProfile.objects.filter(user_id=student_id, parent__user=user).exists()
            if not is_own_child:
                raise PermissionDenied("Yalnızca kendinize bağlı bir öğrenci için talep gönderebilirsiniz.")
            target_student = User.objects.get(id=student_id)
        else:
            raise PermissionDenied("Yalnızca öğrenciler veya veliler ders talebi oluşturabilir.")

        teacher = serializer.validated_data.get('teacher')

        teacher_profile = TeacherProfile.objects.filter(user=teacher).first()
        if not teacher_profile or not teacher_profile.has_active_access:
            raise ValidationError("Bu öğretmen şu anda yeni öğrenci kabul etmiyor.")

        existing = MatchRequest.objects.filter(student=target_student, teacher=teacher)
        if existing.filter(status='ACCEPTED').exists():
            raise ValidationError("Bu öğrenci zaten bu öğretmenden ders alıyor, tekrar talep gönderilemez.")
        if existing.filter(status='PENDING').exists():
            raise ValidationError("Bu öğretmene zaten cevap bekleyen bir talep var.")

        serializer.save(student=target_student)

class MatchRequestRespondView(APIView):
    def patch(self, request, pk):
        try:
            match_request = MatchRequest.objects.get(pk=pk, teacher=request.user)
        except MatchRequest.DoesNotExist:
            return Response({"error": "Talep bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status in ['ACCEPTED', 'REJECTED']:
            if new_status == 'ACCEPTED':
                teacher_profile, _ = TeacherProfile.objects.get_or_create(user=match_request.teacher)
                if not teacher_profile.has_active_access:
                    return Response({"error": "Yeni öğrenci kabul edebilmek için aktif bir aboneliğiniz olmalı."}, status=status.HTTP_403_FORBIDDEN)

            match_request.status = new_status
            match_request.save()

            if new_status == 'ACCEPTED':
                student_profile, _ = StudentProfile.objects.get_or_create(user=match_request.student)
                TutoringRelation.objects.get_or_create(
                    tutor=teacher_profile,
                    student=student_profile,
                    subject=None,
                )

                start = timezone.now() + timedelta(days=1)
                CalendarEvent.objects.create(
                    title=f"{match_request.student.first_name} ile İlk Ders",
                    event_type='LESSON',
                    creator=request.user,
                    student=match_request.student,
                    start_time=start,
                    end_time=start + timedelta(hours=1)
                )

            return Response({"message": f"Talep {new_status} olarak güncellendi."})
        return Response({"error": "Geçersiz durum."}, status=status.HTTP_400_BAD_REQUEST)

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return CalendarEvent.objects.filter(creator=user).order_by('start_time')
        elif user.role == 'STUDENT':
            return CalendarEvent.objects.filter(student=user).order_by('start_time')
        elif user.role == 'PARENT':
            return CalendarEvent.objects.filter(
                student__student_profile__parent__user=user
            ).order_by('start_time')
        return CalendarEvent.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Takvim etkinliğini yalnızca öğretmenler oluşturabilir.")
        serializer.save(creator=self.request.user)

class TeacherReviewViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = TeacherReview.objects.all().order_by('-created_at')
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'STUDENT':
            raise PermissionDenied("Yalnızca öğrenciler değerlendirme bırakabilir.")
        teacher = serializer.validated_data.get('teacher')
        has_relation = TutoringRelation.objects.filter(tutor=teacher, student__user=user).exists()
        if not has_relation:
            raise PermissionDenied("Yalnızca ders aldığınız öğretmenleri değerlendirebilirsiniz.")
        serializer.save(reviewer=user)

    def perform_update(self, serializer):
        if serializer.instance.reviewer != self.request.user:
            raise PermissionDenied("Yalnızca kendi değerlendirmenizi düzenleyebilirsiniz.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.reviewer != self.request.user:
            raise PermissionDenied("Yalnızca kendi değerlendirmenizi silebilirsiniz.")
        instance.delete()
