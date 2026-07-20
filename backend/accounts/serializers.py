from rest_framework import serializers
from .models import User, TeacherProfile, StudentProfile, ParentProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name']

class TeacherProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True) # EKSİK OLAN SATIR EKLENDİ

    class Meta:
        model = TeacherProfile
        # 'role' verisini de React'e gönderiyoruz:
        fields = ('id', 'first_name', 'last_name', 'email', 'role', 'title', 'bio', 'hourly_rate', 'profile_picture', 'is_verified')
class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ParentProfile
        fields = '__all__'

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    parent = ParentProfileSerializer(read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'role')

    def create(self, validated_data):
        # Şifreyi güvenli bir şekilde hashleyerek kullanıcıyı oluşturuyoruz
        user = User(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'STUDENT')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user