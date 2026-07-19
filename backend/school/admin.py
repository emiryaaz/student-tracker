from django.contrib import admin
from .models import Subject, TutoringRelation, Assignment, ExamResult, Resource

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade_level')
    list_filter = ('grade_level',)

@admin.register(TutoringRelation)
class TutoringRelationAdmin(admin.ModelAdmin):
    list_display = ('tutor', 'student', 'subject', 'is_active', 'started_at')
    list_filter = ('is_active', 'subject')
    search_fields = ('tutor__user__first_name', 'student__user__first_name')

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'relation', 'status', 'due_date')
    list_filter = ('status', 'due_date')
    search_fields = ('title',)

@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('exam_name', 'relation', 'score', 'exam_date')
    search_fields = ('exam_name',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'relation', 'uploaded_at')