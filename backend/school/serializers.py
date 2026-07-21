from rest_framework import serializers
from .models import Subject, TutoringRelation, Assignment, ExamResult, Resource, Message    
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

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'

class ExamResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamResult
        fields = '__all__'

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.first_name', read_only=True) 
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'sender_name', 'receiver_name', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp', 'is_read']