from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role')

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role')

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    
    # Listede görünecek sütunlar
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff')
    ordering = ('email',)
    
    # Mevcut kullanıcıyı düzenleme ekranı (Mavi butonla girilen yer)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Kişisel Bilgiler', {'fields': ('first_name', 'last_name', 'role')}),
        ('Yetkiler', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    
    # YENİ KULLANICI EKLEME EKRANI (Sorunu çözen kısım)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            # Şifre doğrulama kutularını (password1 ve password2) arayüze ekliyoruz
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

admin.site.register(User, CustomUserAdmin)