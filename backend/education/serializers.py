from rest_framework import serializers
from .models import Enrollment, Lesson, LessonMaterial, Homework, ExamResult

class HomeworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = '__all__'

class LessonSerializer(serializers.ModelSerializer):
    homeworks = HomeworkSerializer(many=True, read_only=True) # Derse ait ödevleri de listeler

    class Meta:
        model = Lesson
        fields = '__all__'

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)

    class Meta:
        model = ExamResult
        fields = '__all__'