from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, RegisterView, TeacherListView, TeacherDetailView, ProfileUpdateView

router = DefaultRouter()
# basename belirttik çünkü ViewSet model tabanlı değil (Custom ViewSet)
router.register(r'profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path('teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('profile/me/', ProfileUpdateView.as_view(), name='profile-me'),
]