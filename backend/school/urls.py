from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherStudentsViewSet

router = DefaultRouter()
# /api/school/my-students/ adresini oluşturur
router.register(r'my-students', TeacherStudentsViewSet, basename='my-students')

urlpatterns = [
    path('', include(router.urls)),
]