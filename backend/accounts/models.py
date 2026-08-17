from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver

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

    diploma_document = models.FileField(upload_to='verification_docs/', blank=True, null=True, verbose_name="Diploma / Doğrulama Belgesi")
    verification_status = models.CharField(max_length=15, choices=VERIFICATION_STATUS_CHOICES, default='NOT_SUBMITTED', verbose_name="Doğrulama Durumu")
    verification_note = models.TextField(blank=True, null=True, verbose_name="Admin Notu (örn. red sebebi)")

    revenuecat_app_user_id = models.CharField(max_length=255, blank=True, null=True, unique=True, verbose_name="RevenueCat Kullanıcı ID")
    is_subscribed = models.BooleanField(default=False, verbose_name="Aktif Abonelik")
    subscription_expires_at = models.DateTimeField(blank=True, null=True, verbose_name="Abonelik Bitiş Tarihi")
    subscription_platform = models.CharField(max_length=20, blank=True, null=True, verbose_name="Abonelik Platformu (stripe/app_store/play_store)")
    subscription_exempt = models.BooleanField(default=False, verbose_name="Admin Tarafından Ücretsiz Erişim Verildi")

    @property
    def has_active_access(self):
        return self.is_subscribed or self.subscription_exempt

    def __str__(self):
        return f"Öğretmen: {self.user.first_name} {self.user.last_name}"

class ParentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="Telefon")

    def __str__(self):
        return f"Veli: {self.user.first_name} {self.user.last_name}"

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    parent = models.ForeignKey(ParentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name="Velisi")

    def __str__(self):
        return f"Öğrenci: {self.user.first_name} {self.user.last_name}"


class ParentLinkRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Bekliyor'),
        ('ACCEPTED', 'Kabul Edildi'),
        ('REJECTED', 'Reddedildi'),
    )

    parent = models.ForeignKey(ParentProfile, on_delete=models.CASCADE, related_name='sent_link_requests')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='received_link_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.parent.user.first_name} -> {self.student.user.first_name} ({self.get_status_display()})"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'TEACHER':
            TeacherProfile.objects.create(user=instance)
        elif instance.role == 'STUDENT':
            StudentProfile.objects.create(user=instance)
        elif instance.role == 'PARENT':
            ParentProfile.objects.create(user=instance)
