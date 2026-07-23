from rest_framework import viewsets, permissions, generics
from .models import TutoringRelation, Assignment, ExamResult, Resource, Message
from .serializers import (TutoringRelationSerializer, AssignmentSerializer,
                          ExamResultSerializer, ResourceSerializer, MessageSerializer)
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

class TeacherStudentsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutoringRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TutoringRelation.objects.filter(tutor__user=self.request.user, is_active=True)

# AKILLI FİLTRELEME SINIFI
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

# Tüm modelleri tek satırla akıllı filtreye bağladık
class AssignmentViewSet(BaseRoleViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

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
            # HARİKA DETAY: Eğer bir sohbet açılmışsa, o kişiden gelen mesajları otomatik OKUNDU yap!
            Message.objects.filter(sender_id=chat_user_id, receiver=user, is_read=False).update(is_read=True)

            return Message.objects.filter(
                (Q(sender=user) & Q(receiver_id=chat_user_id)) |
                (Q(sender_id=chat_user_id) & Q(receiver=user))
            ).order_by('timestamp')

        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by

    def perform_create(self, serializer):
        # Mesaj gönderildiğinde 'sender' kısmını otomatik olarak istek atan kullanıcı yaparız
        serializer.save(sender=self.request.user)

class UnreadMessageCountView(APIView):
    def get(self, request):
        # Sadece bana gelen ve okunmamış olan mesajları say
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread_count': count})