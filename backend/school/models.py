from django.db import models
from accounts.models import TeacherProfile, StudentProfile
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

class Subject(models.Model):
    name = models.CharField(max_length=100, verbose_name="Ders/Konu Adı")
    grade_level = models.IntegerField(null=True, blank=True, verbose_name="Sınıf Seviyesi (Örn: 10)")

    def __str__(self):
        return f"{self.grade_level}. Sınıf - {self.name}" if self.grade_level else self.name

class TutoringRelation(models.Model):
    tutor = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='students_list')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='tutors_list')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Aktif Öğrenci")
    started_at = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('tutor', 'student', 'subject')
        verbose_name = "Özel Ders Bağlantısı"
        verbose_name_plural = "Özel Ders Bağlantıları"

    def __str__(self):
        return f"{self.tutor.user.first_name} -> {self.student.user.first_name} ({self.subject})"

class Assignment(models.Model):
    STATUS_CHOICES = (('PENDING', 'Bekliyor'), ('COMPLETED', 'Tamamlandı'), ('LATE', 'Gecikti'))
    relation = models.ForeignKey(TutoringRelation, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200, verbose_name="Ödev Başlığı")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    due_date = models.DateTimeField(verbose_name="Son Teslim Tarihi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.relation.student.user.first_name} - {self.title}"

class ExamResult(models.Model):
    relation = models.ForeignKey(TutoringRelation, on_delete=models.CASCADE, related_name='exams')
    exam_name = models.CharField(max_length=200, verbose_name="Sınav/Konu Adı")
    score = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Puan/Net")
    exam_date = models.DateField(verbose_name="Sınav Tarihi")
    notes = models.TextField(blank=True, null=True, verbose_name="Öğretmen Notu")

class Resource(models.Model):
    relation = models.ForeignKey(TutoringRelation, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200, verbose_name="Kaynak Başlığı")
    url = models.URLField(blank=True, null=True, verbose_name="Link (Opsiyonel)")
    file = models.FileField(upload_to='resources/', blank=True, null=True, verbose_name="Dosya (Opsiyonel)")
    uploaded_at = models.DateTimeField(auto_now_add=True)

class TeacherReview(models.Model):
    teacher = models.ForeignKey('accounts.TeacherProfile', on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='given_reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Puan (1-5)")
    comment = models.TextField(verbose_name="Yorum/Değerlendirme")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('teacher', 'reviewer')

    def __str__(self):
        return f"{self.rating} Yıldız - {self.reviewer.first_name} -> {self.teacher.user.first_name}"

class Message(models.Model):
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_messages', verbose_name="Gönderen")
    receiver = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_messages', verbose_name="Alıcı")
    content = models.TextField(verbose_name="Mesaj İçeriği")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Gönderilme Zamanı")
    is_read = models.BooleanField(default=False, verbose_name="Okundu mu?")

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.first_name} -> {self.receiver.first_name}: {self.content[:20]}"

class MatchRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Bekliyor'),
        ('ACCEPTED', 'Kabul Edildi'),
        ('REJECTED', 'Reddedildi'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    note = models.TextField(blank=True, null=True, help_text="Öğrencinin öğretmene iletmek istediği ilk mesaj/not")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.first_name} -> {self.teacher.first_name} ({self.get_status_display()})"


class CalendarEvent(models.Model):
    EVENT_TYPES = (
        ('LESSON', 'Ders'),
        ('HOMEWORK', 'Ödev'),
        ('EXAM', 'Sınav'),
        ('OTHER', 'Diğer'),
    )

    title = models.CharField(max_length=255, help_text="Örn: Matematik Türev Dersi, Fizik Deneme Sınavı")
    description = models.TextField(blank=True, null=True)
    event_type = models.CharField(max_length=15, choices=EVENT_TYPES, default='LESSON')

    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_events', null=True, blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.get_event_type_display()}"
