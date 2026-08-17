from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProfileViewSet, RegisterView, TeacherListView, TeacherDetailView, ProfileUpdateView,
                     TeacherVerificationListView, TeacherVerificationReviewView,
                     ParentLinkRequestListView, ParentLinkRequestRespondView,
                     PasswordResetRequestView, PasswordResetConfirmView,
                     RevenueCatWebhookView, TeacherSubscriptionOverrideView,
                     LemonSqueezyWebhookView)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('teachers/', TeacherListView.as_view(), name='teacher-list'),
    path('teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('profile/me/', ProfileUpdateView.as_view(), name='profile-me'),
    path('admin/teacher-verifications/', TeacherVerificationListView.as_view(), name='teacher-verification-list'),
    path('admin/teacher-verifications/<int:pk>/review/', TeacherVerificationReviewView.as_view(), name='teacher-verification-review'),
    path('admin/teacher-verifications/<int:pk>/subscription-override/', TeacherSubscriptionOverrideView.as_view(), name='teacher-subscription-override'),
    path('link-requests/', ParentLinkRequestListView.as_view(), name='link-request-list'),
    path('link-requests/<int:pk>/respond/', ParentLinkRequestRespondView.as_view(), name='link-request-respond'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('revenuecat/webhook/', RevenueCatWebhookView.as_view(), name='revenuecat-webhook'),
    path('lemonsqueezy/webhook/', LemonSqueezyWebhookView.as_view(), name='lemonsqueezy-webhook'),
]