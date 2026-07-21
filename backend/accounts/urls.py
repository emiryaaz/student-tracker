from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, RegisterView, TeacherListView

router = DefaultRouter()
# basename belirttik çünkü ViewSet model tabanlı değil (Custom ViewSet)
router.register(r'profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
]