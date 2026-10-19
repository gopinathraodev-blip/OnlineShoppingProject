
from django.urls import path

from .views import dashboard, export_sales_csv

urlpatterns = [
    path("", dashboard, name="analytics-dashboard"),
    path("export/csv/", export_sales_csv, name="analytics-export-csv"),
]