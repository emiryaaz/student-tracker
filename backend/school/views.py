from rest_framework import viewsets, permissions
from .models import TutoringRelation, Assignment, ExamResult, Resource
from .serializers import (TutoringRelationSerializer, AssignmentSerializer,
                          ExamResultSerializer, ResourceSerializer)

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