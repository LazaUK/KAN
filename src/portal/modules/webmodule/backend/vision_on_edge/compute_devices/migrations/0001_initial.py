# Generated by Django 3.0.8 on 2023-01-19 08:26

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ComputeDevice',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('iothub', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('iotedge_device', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('architecture', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('acceleration', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('tag_list', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('kan_id', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('solution_id', models.CharField(blank=True, default='', max_length=1000, null=True)),
                ('status', models.CharField(blank=True, default='', max_length=1000)),
                ('is_k8s', models.BooleanField(default=False)),
                ('cluster_type', models.CharField(blank=True, default='current', max_length=1000, null=True)),
            ],
        ),
    ]