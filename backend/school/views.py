from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import PermissionDenied
from .models import TutoringRelation, Assignment, ExamResult, Resource, Message
from .serializers import (TutoringRelationSerializer, AssignmentSerializer,
                          ExamResultSerializer, ResourceSerializer, MessageSerializer)
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import MatchRequest, CalendarEvent
from accounts.models import TeacherProfile, StudentProfile
from .serializers import MatchRequestSerializer, CalendarEventSerializer

class TeacherStudentsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutoringRelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TutoringRelation.objects.filter(tutor__user=self.request.user, is_active=True)

# AKILLI FİLTRELEME SINIFI
class BaseRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return self.queryset.filter(relation__tutor__user=user)
        elif user.role == 'STUDENT':
            return self.queryset.filter(relation__student__user=user)
        elif user.role == 'PARENT':
            return self.queryset.filter(relation__student__parent__user=user)
        return self.queryset.none()

    def perform_create(self, serializer):
        # GÜVENLİK DÜZELTMESİ: get_queryset sadece GET isteklerini filtreler; POST bu kontrolden
        # geçmediği için, bu olmadan herhangi bir giriş yapmış kullanıcı (öğrenci/veli dahil)
        # kendisiyle ilgisi olmayan bir "relation" ID'si vererek sahte ödev/sınav/kaynak
        # oluşturabiliyordu. Sadece öğretmen, sadece kendi öğrencisi için kayıt açabilir.
        user = self.request.user
        if user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler oluşturabilir.")
        relation = serializer.validated_data.get('relation')
        if not relation or relation.tutor.user != user:
            raise PermissionDenied("Yalnızca kendi öğrencileriniz için kayıt oluşturabilirsiniz.")
        serializer.save()

    def perform_update(self, serializer):
        # GÜVENLİK DÜZELTMESİ: get_queryset bir öğrencinin sadece kendi kaydını görmesine izin
        # verir, ama bunu istediği alanla güncelleyebileceği anlamına gelmemeli. Varsayılan
        # olarak güncellemeyi de öğretmenle sınırlıyoruz; öğrencinin ödev durumunu işaretleme
        # gibi özel bir izin gereken yerlerde (AssignmentViewSet) bu metod ayrıca override edilir.
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler düzenleyebilir.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Bu kaydı yalnızca öğretmenler silebilir.")
        instance.delete()

# Tüm modelleri tek satırla akıllı filtreye bağladık
class AssignmentViewSet(BaseRoleViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'STUDENT':
            # Öğrenci sadece kendi ödevinin durumunu (status) işaretleyebilir, başka alanı değiştiremez
            if set(serializer.validated_data.keys()) - {'status'}:
                raise PermissionDenied("Öğrenciler yalnızca ödev durumunu güncelleyebilir.")
            serializer.save()
        else:
            super().perform_update(serializer)

class ExamResultViewSet(BaseRoleViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer

class ResourceViewSet(BaseRoleViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        chat_user_id = self.request.query_params.get('user_id')

        if chat_user_id:
            # Karşı taraftan gelen mesajları otomatik "Okundu" işaretle
            Message.objects.filter(sender_id=chat_user_id, receiver=user, is_read=False).update(is_read=True)
            
            # LÜTFEN DİKKAT: En sondaki .order_by('timestamp') kısmında parantezler eksiksiz olmalı
            return Message.objects.filter(
                (Q(sender=user) & Q(receiver_id=chat_user_id)) |
                (Q(sender_id=chat_user_id) & Q(receiver=user))
            ).order_by('timestamp')

        # LÜTFEN DİKKAT: En sondaki .order_by('-timestamp') kısmında parantezler eksiksiz olmalı
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-timestamp')

    def perform_create(self, serializer):
        # Mesaj gönderildiğinde 'sender' kısmını otomatik olarak istek atan kullanıcı yaparız
        serializer.save(sender=self.request.user)

class UnreadMessageCountView(APIView):
    def get(self, request):
        # Sadece bana gelen ve okunmamış olan mesajları say
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'unread_count': count})

# 1. İstekleri Listeleme ve Oluşturma
class MatchRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MatchRequestSerializer

    def get_queryset(self):
        user = self.request.user
        
        # KESİN ÇÖZÜM: Rol kontrolü (if) yapmadan, bu kullanıcının
        # İSTER ÖĞRETMEN İSTER ÖĞRENCİ OLARAK dahil olduğu tüm talepleri getir!
        return MatchRequest.objects.filter(
            Q(teacher=user) | Q(student=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        # Sadece öğrenciler ders talebi oluşturabilir; aksi halde bir öğretmen/veli de
        # bu uca istek atıp kendini öğrenci gibi göstererek anlamsız bir kayıt açabilirdi.
        if self.request.user.role != 'STUDENT':
            raise PermissionDenied("Yalnızca öğrenciler ders talebi oluşturabilir.")
        serializer.save(student=self.request.user)
# 2. Öğretmenin İsteği Onaylaması / Reddetmesi
class MatchRequestRespondView(APIView):
    def patch(self, request, pk):
        try:
            # Sadece bu öğretmene ait olan isteği bul
            match_request = MatchRequest.objects.get(pk=pk, teacher=request.user)
        except MatchRequest.DoesNotExist:
            return Response({"error": "Talep bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status in ['ACCEPTED', 'REJECTED']:
            match_request.status = new_status
            match_request.save()

            # HARİKA DETAY: Eğer öğretmen kabul ederse, yarına otomatik "İlk Ders" etkinliği oluştur
            if new_status == 'ACCEPTED':
                teacher_profile, _ = TeacherProfile.objects.get_or_create(user=match_request.teacher)
                student_profile, _ = StudentProfile.objects.get_or_create(user=match_request.student)
                TutoringRelation.objects.get_or_create(
                    tutor=teacher_profile,
                    student=student_profile,
                    subject=None,
                )

                
                start = timezone.now() + timedelta(days=1) # Yarın aynı saat
                CalendarEvent.objects.create(
                    title=f"{match_request.student.first_name} ile İlk Ders",
                    event_type='LESSON',
                    creator=request.user,
                    student=match_request.student,
                    start_time=start,
                    end_time=start + timedelta(hours=1) # 1 Saat sürecek
                )

            return Response({"message": f"Talep {new_status} olarak güncellendi."})
        return Response({"error": "Geçersiz durum."}, status=status.HTTP_400_BAD_REQUEST)

class CalendarEventViewSet(viewsets.ModelViewSet):
    """Takvim: öğretmen kendi oluşturduğu etkinlikleri, öğrenci kendi adına
    açılmış etkinlikleri, veli ise çocuğunun etkinliklerini görür."""
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'TEACHER':
            return CalendarEvent.objects.filter(creator=user).order_by('start_time')
        elif user.role == 'STUDENT':
            return CalendarEvent.objects.filter(student=user).order_by('start_time')
        elif user.role == 'PARENT':
            return CalendarEvent.objects.filter(
                student__student_profile__parent__user=user
            ).order_by('start_time')
        return CalendarEvent.objects.none()

    def perform_create(self, serializer):
        # Aynı güvenlik boşluğu: rol kontrolü olmadan bir öğrenci/veli de POST atıp
        # kendi adına veya başkası adına takvim etkinliği oluşturabilirdi.
        if self.request.user.role != 'TEACHER':
            raise PermissionDenied("Takvim etkinliğini yalnızca öğretmenler oluşturabilir.")
        serializer.save(creator=self.request.user)