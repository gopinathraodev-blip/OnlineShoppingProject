from django.urls import path

from .web_views import (
    checkout_page,
    order_list_page,
    order_detail_page,
)


urlpatterns = [
    path(
        "checkout/",
        checkout_page,
        name="checkout-page",
    ),

    path(
        "orders/",
        order_list_page,
        name="order-list-page",
    ),

    path(
        "orders/<int:order_id>/",
        order_detail_page,
        name="order-detail-page",
    ),
]