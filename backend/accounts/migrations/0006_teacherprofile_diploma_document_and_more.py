# Generated manually to match Django's migration format (see 0005_teacherprofile_bio_teacherprofile_hourly_rate_and_more.py)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_teacherprofile_bio_teacherprofile_hourly_rate_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacherprofile',
            name='diploma_document',
            field=models.FileField(blank=True, null=True, upload_to='verification_docs/', verbose_name='Diploma / Doğrulama Belgesi'),
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='verification_status',
            field=models.CharField(choices=[('NOT_SUBMITTED', 'Belge Yüklenmedi'), ('PENDING', 'İnceleniyor'), ('APPROVED', 'Onaylandı'), ('REJECTED', 'Reddedildi')], default='NOT_SUBMITTED', max_length=15, verbose_name='Doğrulama Durumu'),
        ),
        migrations.AddField(
            model_name='teacherprofile',
            name='verification_note',
            field=models.TextField(blank=True, null=True, verbose_name='Admin Notu (örn. red sebebi)'),
        ),
    ]
