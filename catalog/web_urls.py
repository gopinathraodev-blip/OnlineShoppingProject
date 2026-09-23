from django.urls import path

from .views import product_list, product_detail


urlpatterns = [
    path(
        "products/",
        product_list,
        name="product-list",
    ),
    path(
        "products/<int:product_id>/",
        product_detail,
        name="product-detail",
    ),
]