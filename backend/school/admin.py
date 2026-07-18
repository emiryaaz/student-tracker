from django.contrib import admin
from .models import Subject, TutoringRelation

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade_level')
    list_filter = ('grade_level',)

@admin.register(TutoringRelation)
class TutoringRelationAdmin(admin.ModelAdmin):
    list_display = ('tutor', 'student', 'subject', 'is_active', 'started_at')
    list_filter = ('is_active', 'subject')
    search_fields = ('tutor__user__first_name', 'student__user__first_name')