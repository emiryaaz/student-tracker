from django.contrib import admin
from .models import Enrollment, Lesson, LessonMaterial, Homework, ExamResult

admin.site.register(Enrollment)
admin.site.register(Lesson)
admin.site.register(LessonMaterial)
admin.site.register(Homework)
admin.site.register(ExamResult)