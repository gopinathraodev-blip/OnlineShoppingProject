from django.urls import path

from .web_views import cart_page


urlpatterns = [
    path(
        "cart/",
        cart_page,
        name="cart-page",
    ),
]