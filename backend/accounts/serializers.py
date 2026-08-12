from rest_framework import serializers
from .models import User, TeacherProfile, StudentProfile, ParentProfile, ParentLinkRequest

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name']

class TeacherProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model = TeacherProfile
        fields = ('id', 'user_id', 'first_name', 'last_name', 'email', 'role', 'title', 'bio', 'hourly_rate',
                   'profile_picture', 'is_verified', 'average_rating', 'review_count',
                   'diploma_document', 'verification_status', 'verification_note')
        read_only_fields = ('is_verified', 'verification_status', 'verification_note')

class ChildSummarySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ('id', 'user')

class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    children = ChildSummarySerializer(many=True, read_only=True)

    class Meta:
        model = ParentProfile
        fields = ('id', 'user', 'phone_number', 'children')

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parent = ParentProfileSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = '__all__'

class ParentLinkRequestSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.user.get_full_name', read_only=True)
    parent_email = serializers.EmailField(source='parent.user.email', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)

    class Meta:
        model = ParentLinkRequest
        fields = ('id', 'parent', 'parent_name', 'parent_email', 'student', 'student_name', 'status', 'created_at', 'updated_at')
        read_only_fields = ('parent', 'student', 'status')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'role')

    def validate_role(self, value):
        allowed = {'STUDENT', 'TEACHER', 'PARENT'}
        if value not in allowed:
            raise serializers.ValidationError("Geçersiz rol. Yalnızca öğrenci, öğretmen veya veli olarak kayıt olabilirsiniz.")
        return value

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'STUDENT')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
