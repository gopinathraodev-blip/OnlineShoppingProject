from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductViewSet,
    product_list,
    product_detail,
)


router = DefaultRouter()

router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")


urlpatterns = [
    path("", product_list, name="product_list"),
    path("product/<int:product_id>/", product_detail, name="product_detail"),
]

urlpatterns += router.urls