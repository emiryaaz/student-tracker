# Generated manually to match Django's migration format

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_teacherprofile_diploma_document_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ParentLinkRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'Bekliyor'), ('ACCEPTED', 'Kabul Edildi'), ('REJECTED', 'Reddedildi')], default='PENDING', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_link_requests', to='accounts.parentprofile')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_link_requests', to='accounts.studentprofile')),
            ],
        ),
    ]
