from rest_framework import viewsets, permissions
from .models import TutoringRelation
from .serializers import TutoringRelationSerializer

class TeacherStudentsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutoringRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Sadece öğretmen rolündekilere veri döndür
        if user.role == 'TEACHER':
            return TutoringRelation.objects.filter(tutor__user=user, is_active=True)
        return TutoringRelation.objects.none()