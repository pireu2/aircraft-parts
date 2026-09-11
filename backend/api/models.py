from django.db import models


class Aircraft(models.Model):
    serial_number = models.CharField(max_length=64, primary_key=True)
    model = models.CharField(max_length=128)
    manufacturer = models.CharField(max_length=128)
    capacity = models.IntegerField()
    configuration = models.CharField(max_length=64)

    class Meta:
        ordering = ["serial_number"]
        verbose_name_plural = "Aircraft"

    @property
    def name(self) -> str:
        return f"{self.manufacturer} {self.model}"

    def __str__(self):
        return f"{self.model} ({self.serial_number})"


class Material(models.Model):
    part_number = models.CharField(max_length=64, primary_key=True)
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

    # Compound natural key: {aircraft_serial}_{material_pn}_{arrival_date}
    id = models.CharField(max_length=160, primary_key=True, editable=False)
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
        constraints = [
            models.UniqueConstraint(
                fields=["aircraft", "material", "arrival_date"],
                name="unique_order_aircraft_material_date",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.id:
            aircraft_key = self.aircraft_id or (self.aircraft.serial_number if self.aircraft else "")
            material_key = self.material_id or (self.material.part_number if self.material else "")
            date_str = self.arrival_date.isoformat() if hasattr(self.arrival_date, "isoformat") else str(self.arrival_date)
            self.id = f"{aircraft_key}_{material_key}_{date_str}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id}: {self.material.name} -> {self.aircraft.model} ({self.status})"


