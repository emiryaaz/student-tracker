from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver

# 1. KULLANICI MODELİ
class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Öğretmen'),
        ('STUDENT', 'Öğrenci'),
        ('PARENT', 'Veli'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='STUDENT')

# 2. ÖĞRETMEN PROFİLİ
class TeacherProfile(models.Model):
    VERIFICATION_STATUS_CHOICES = (
        ('NOT_SUBMITTED', 'Belge Yüklenmedi'),
        ('PENDING', 'İnceleniyor'),
        ('APPROVED', 'Onaylandı'),
        ('REJECTED', 'Reddedildi'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    title = models.CharField(max_length=150, blank=True, null=True, verbose_name="Uzmanlık Ünvanı")
    bio = models.TextField(blank=True, null=True, verbose_name="Hakkımda")
    hourly_rate = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True, verbose_name="Saatlik Ücret (₺)")
    profile_picture = models.ImageField(upload_to='profiles/teachers/', blank=True, null=True, verbose_name="Profil Fotoğrafı")
    is_verified = models.BooleanField(default=False, verbose_name="Doğrulanmış Eğitmen")

    # KİMLİK/DİPLOMA DOĞRULAMA: öğretmen diplomasını/belgesini yükler, admin inceleyip
    # onaylar ya da reddeder. is_verified sadece admin onayıyla True olabilir; öğretmen
    # bu alanı (veya verification_status/verification_note'u) doğrudan değiştiremez
    # (bkz. TeacherProfileSerializer.read_only_fields).
    diploma_document = models.FileField(upload_to='verification_docs/', blank=True, null=True, verbose_name="Diploma / Doğrulama Belgesi")
    verification_status = models.CharField(max_length=15, choices=VERIFICATION_STATUS_CHOICES, default='NOT_SUBMITTED', verbose_name="Doğrulama Durumu")
    verification_note = models.TextField(blank=True, null=True, verbose_name="Admin Notu (örn. red sebebi)")

    def __str__(self):
        return f"Öğretmen: {self.user.first_name} {self.user.last_name}"
        
# 3. VELİ PROFİLİ (Öğrenciden ÖNCE tanımlanmalı ki öğrenci onu tanıyabilsin)
class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="Telefon")

    def __str__(self):
        return f"Veli: {self.user.first_name} {self.user.last_name}"

# 4. ÖĞRENCİ PROFİLİ
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    parent = models.ForeignKey(ParentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name="Velisi")

    def __str__(self):
        return f"Öğrenci: {self.user.first_name} {self.user.last_name}"


# 5. OTOMATİK PROFİL OLUŞTURMA SİNYALİ
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'TEACHER':
            TeacherProfile.objects.create(user=instance)
        elif instance.role == 'STUDENT':
            StudentProfile.objects.create(user=instance)
        elif instance.role == 'PARENT':
            ParentProfile.objects.create(user=instance)