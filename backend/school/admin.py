from django.contrib import admin
from .models import Classroom, Course

class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('name', 'advisor_teacher')
    # Öğrenci seçme (Çoka Çok ilişki) kutusunu görsel olarak güzelleştirir
    filter_horizontal = ('students',) 

class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'classroom')
    list_filter = ('classroom', 'teacher')

admin.site.register(Classroom, ClassroomAdmin)
admin.site.register(Course, CourseAdmin)