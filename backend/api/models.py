import uuid
from django.db import models


class Aircraft(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    serial_number = models.CharField(max_length=64, unique=True)
    model = models.CharField(max_length=128)
    manufacturer = models.CharField(max_length=128)
    capacity = models.IntegerField()
    configuration = models.CharField(max_length=64)

    class Meta:
        ordering = ["serial_number"]

    def __str__(self):
        return f"{self.model} ({self.serial_number})"


class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    part_number = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    type = models.CharField(max_length=64)
    weight = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["part_number"]

    def __str__(self):
        return f"{self.name} [{self.part_number}]"


class Order(models.Model):
    class Status(models.TextChoices):
        ARRIVED = "Arrived", "Arrived"
        PENDING = "Pending", "Pending"
        REQUESTED = "Requested", "Requested"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    aircraft = models.ForeignKey(
        Aircraft,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    material = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    arrival_date = models.DateField()
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.REQUESTED,
    )

    class Meta:
        ordering = ["arrival_date", "id"]

    def __str__(self):
        return f"Order #{self.id}: {self.material.name} -> {self.aircraft.model} ({self.status})"


class ImportLog(models.Model):
    class Action(models.TextChoices):
        IMPORT = "import", "Import"
        CLEAR = "clear", "Clear"

    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=32, choices=Action.choices)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.SUCCESS)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    diff = models.JSONField(default=dict, blank=True)
    total_created = models.IntegerField(default=0)
    total_updated = models.IntegerField(default=0)
    total_deleted = models.IntegerField(default=0)
    total_records = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} [{self.status}] at {self.created_at}"
