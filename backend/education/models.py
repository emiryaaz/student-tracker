from django.db import models
from accounts.models import TeacherProfile, StudentProfile

class Enrollment(models.Model):
    """Öğretmen ve Öğrenci arasındaki eşleşmeyi tutar"""
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Aktif'
        ENDED = 'ENDED', 'Bitti'

    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='enrollments')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.teacher} -> {self.student}"


class Lesson(models.Model):
    """İşlenecek veya işlenmiş ders planı"""
    class Status(models.TextChoices):
        PLANNED = 'PLANNED', 'Planlandı'
        COMPLETED = 'COMPLETED', 'Tamamlandı'
        CANCELLED = 'CANCELLED', 'İptal Edildi'

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lessons')
    date_time = models.DateTimeField()
    topic_title = models.CharField(max_length=200)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PLANNED)
    notes = models.TextField(blank=True, null=True) # Öğretmenin ders notları

    def __str__(self):
        return f"{self.topic_title} ({self.date_time.strftime('%Y-%m-%d %H:%M')})"


class LessonMaterial(models.Model):
    """Ders videosu, PDF veya konu anlatım notları (İleride genişletilecek)"""
    class MaterialType(models.TextChoices):
        VIDEO = 'VIDEO', 'Video'
        PDF = 'PDF', 'PDF Dokümanı'
        LINK = 'LINK', 'Dış Bağlantı'

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials')
    material_type = models.CharField(max_length=10, choices=MaterialType.choices)
    title = models.CharField(max_length=150)
    file_url = models.URLField(max_length=500) # İleride AWS S3 linki vb. olabilir

    def __str__(self):
        return self.title


class Homework(models.Model):
    """Derse bağlı verilen ödevler"""
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='homeworks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    is_completed = models.BooleanField(default=False)
    ai_generated = models.BooleanField(default=False) # Yapay zeka ile mi oluşturuldu?

    def __str__(self):
        return self.title


class ExamResult(models.Model):
    """Deneme veya mini test sonuçları"""
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='exam_results')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.SET_NULL, null=True, related_name='given_exams')
    exam_title = models.CharField(max_length=200)
    score = models.DecimalField(max_digits=5, decimal_places=2) # Örn: 85.50
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    feedback_notes = models.TextField(blank=True, null=True)
    date_entered = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.exam_title} - {self.student.user.email} ({self.score}/{self.max_score})"