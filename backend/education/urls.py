from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonViewSet, HomeworkViewSet, ExamResultViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'homeworks', HomeworkViewSet, basename='homework')
router.register(r'exams', ExamResultViewSet, basename='exam') # Sınavları ekledik

urlpatterns = [
    path('', include(router.urls)),
]