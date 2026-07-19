from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (TeacherStudentsViewSet, AssignmentViewSet, 
                    ExamResultViewSet, ResourceViewSet)

router = DefaultRouter()
router.register(r'my-students', TeacherStudentsViewSet, basename='my-students')
router.register(r'assignments', AssignmentViewSet, basename='assignments')
router.register(r'exams', ExamResultViewSet, basename='exams')
router.register(r'resources', ResourceViewSet, basename='resources')

urlpatterns = [
    path('', include(router.urls)),
]