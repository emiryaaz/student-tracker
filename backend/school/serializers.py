from rest_framework import serializers
from django.utils import timezone
from .models import Subject, TutoringRelation, Assignment, ExamResult, Resource, Message, MatchRequest, CalendarEvent, TeacherReview
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
    student_name = serializers.CharField(source='relation.student.user.first_name', read_only=True)
    # Veritabanında fiilen 'LATE' durumuna geçiren bir zamanlanmış görev (Celery/cron) yok;
    # bunu her istekte anlık hesaplayarak sunuyoruz, böylece ek bir arka plan işi kurmadan
    # arayüz "gecikti" durumunu gösterebiliyor. Öğrenci tamamladıysa (COMPLETED) artık geç
    # sayılmaz.
    is_late = serializers.SerializerMethodField()

    def get_is_late(self, obj):
        return obj.status == 'PENDING' and obj.due_date < timezone.now()

    class Meta:
        model = Assignment
        fields = '__all__'

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='relation.student.user.first_name', read_only=True)

    class Meta:
        model = ExamResult
        fields = '__all__'
        
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.first_name', read_only=True) 
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'sender_name', 'receiver_name', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp', 'is_read']

class MatchRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    # Veli talebi gönderiyorsa, hangi çocuğu için gönderdiğini bu alanla belirtir.
    # Öğrenci kendi adına gönderirken buna gerek yok (request.user zaten öğrenci olur).
    student_id = serializers.IntegerField(write_only=True, required=False, help_text="Veli ise: talebin hangi öğrencisi için olduğu")

    class Meta:
        model = MatchRequest
        fields = '__all__'
        # ÇÖZÜM: Django'ya bu alanları kapıdaki kontrolde sorma diyoruz!
        read_only_fields = ['student', 'status']

class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = '__all__'

class TeacherReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.first_name', read_only=True)

    class Meta:
        model = TeacherReview
        fields = ('id', 'teacher', 'reviewer', 'reviewer_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('reviewer',)