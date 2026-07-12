from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import User, TeacherProfile, StudentProfile, ParentProfile
from .serializers import (
    UserSerializer, TeacherProfileSerializer, 
    StudentProfileSerializer, ParentProfileSerializer
)

class ProfileViewSet(viewsets.ViewSet):
    """
    Kullanıcıların kendi profil bilgilerini ve 
    öğretmenlerin kendi öğrencilerini görebileceği genel ViewSet.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Kullanıcının kendi rolüne uygun profil verisini döner"""
        user = request.user
        
        if user.role == 'TEACHER':
            profile = TeacherProfile.objects.get(user=user)
            serializer = TeacherProfileSerializer(profile)
        elif user.role == 'STUDENT':
            profile = StudentProfile.objects.get(user=user)
            serializer = StudentProfileSerializer(profile)
        elif user.role == 'PARENT':
            profile = ParentProfile.objects.get(user=user)
            serializer = ParentProfileSerializer(profile)
        else:
            serializer = UserSerializer(user)
            
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_students(self, request):
        """Eğer kullanıcı öğretmense veya veliyse onlara bağlı öğrencileri listeler"""
        user = request.user
        
        if user.role == 'TEACHER':
            # Öğretmenin Enrollment (kayıt) üzerinden ders verdiği öğrencileri buluruz
            # education uygulaması ile ilişkili olduğu için filtreleme yapıyoruz
            students = StudentProfile.objects.filter(enrollments__teacher__user=user).distinct()
            serializer = StudentProfileSerializer(students, many=True)
            return Response(serializer.data)
            
        elif user.role == 'PARENT':
            # Velinin kendi çocukları
            students = StudentProfile.objects.filter(parent__user=user)
            serializer = StudentProfileSerializer(students, many=True)
            return Response(serializer.data)
            
        return Response(
            {"detail": "Bu işlemi yapmaya yetkiniz yok."}, 
            status=status.HTTP_403_FORBIDDEN
        )