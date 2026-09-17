from django.urls import path

from .views import (
    CheckoutView,
    OrderListView,
    OrderDetailView,
)


urlpatterns = [
    path(
        "",
        OrderListView.as_view(),
        name="order-list",
    ),
    path(
        "checkout/",
        CheckoutView.as_view(),
        name="checkout",
    ),
    path(
        "<int:pk>/",
        OrderDetailView.as_view(),
        name="order-detail",
    ),
]