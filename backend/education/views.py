from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Lesson, Homework, ExamResult
from .serializers import LessonSerializer, HomeworkSerializer, ExamResultSerializer

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Lesson.objects.filter(enrollment__teacher__user=user)
        elif user.role == 'STUDENT':
            return Lesson.objects.filter(enrollment__student__user=user)
        elif user.role == 'PARENT':
            # Velinin kendisine bağlı olan öğrencilerin derslerini getirir
            return Lesson.objects.filter(enrollment__student__parent__user=user)
        return Lesson.objects.all()


class HomeworkViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return Homework.objects.filter(lesson__enrollment__teacher__user=user)
        elif user.role == 'STUDENT':
            return Homework.objects.filter(lesson__enrollment__student__user=user)
        elif user.role == 'PARENT':
            return Homework.objects.filter(lesson__enrollment__student__parent__user=user)
        return Homework.objects.all()


class ExamResultViewSet(viewsets.ModelViewSet):
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return ExamResult.objects.filter(teacher__user=user)
        elif user.role == 'STUDENT':
            return ExamResult.objects.filter(student__user=user)
        elif user.role == 'PARENT':
            return ExamResult.objects.filter(student__parent__user=user)
        return ExamResult.objects.all()