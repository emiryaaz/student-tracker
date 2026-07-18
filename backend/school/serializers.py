from rest_framework import serializers
from .models import Subject, TutoringRelation
from accounts.models import StudentProfile

# Dersi ve sınıf seviyesini paketler
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'grade_level']

# Öğrencinin isim ve e-postasını User modelinden çekip paketler
class StudentSimpleSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = StudentProfile
        fields = ['id', 'first_name', 'last_name', 'email']

# Öğretmen-Öğrenci ilişkisini ve içindeki tüm bilgileri paketler
class TutoringRelationSerializer(serializers.ModelSerializer):
    student = StudentSimpleSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = TutoringRelation
        fields = ['id', 'student', 'subject', 'is_active', 'started_at']