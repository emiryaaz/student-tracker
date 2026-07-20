from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import User, TeacherProfile, StudentProfile, ParentProfile
from .serializers import (
    UserSerializer, TeacherProfileSerializer, 
    StudentProfileSerializer, ParentProfileSerializer,
    RegisterSerializer
)

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
            students = StudentProfile.objects.filter(enrollments__teacher__user=user).distinct()
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