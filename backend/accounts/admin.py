from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TeacherProfile, ParentProfile, StudentProfile

# Özel kullanıcı modelimiz için temel görünüm ayarları
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'role', 'is_staff', 'is_active']
    ordering = ['email']
    # Şifre değiştirme veya ek alanlar için fieldsets eklenebilir ancak şimdilik basit tutuyoruz

admin.site.register(User, CustomUserAdmin)
admin.site.register(TeacherProfile)
admin.site.register(ParentProfile)
admin.site.register(StudentProfile)