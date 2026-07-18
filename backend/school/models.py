from django.db import models
from accounts.models import TeacherProfile, StudentProfile

# STANDART DERS/BRANŞ MODELİ (Sıralama ve testler için kullanılacak)
class Subject(models.Model):
    name = models.CharField(max_length=100, verbose_name="Ders/Konu Adı")
    grade_level = models.IntegerField(null=True, blank=True, verbose_name="Sınıf Seviyesi (Örn: 10)")

    def __str__(self):
        return f"{self.grade_level}. Sınıf - {self.name}" if self.grade_level else self.name

# ÖĞRETMEN - ÖĞRENCİ BAĞLANTISI (İzolasyonu sağlayan tablo)
class TutoringRelation(models.Model):
    tutor = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='students_list')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='tutors_list')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name="Aktif Öğrenci")
    started_at = models.DateField(auto_now_add=True)

    class Meta:
        # Aynı öğretmen, aynı öğrenciye aynı dersi iki kez ekleyemesin
        unique_together = ('tutor', 'student', 'subject')
        verbose_name = "Özel Ders Bağlantısı"
        verbose_name_plural = "Özel Ders Bağlantıları"

    def __str__(self):
        return f"{self.tutor.user.first_name} -> {self.student.user.first_name} ({self.subject})"