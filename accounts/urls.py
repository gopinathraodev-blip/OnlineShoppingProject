from django.urls import path

from .views import CustomerRegistrationView, LoginView


urlpatterns = [
    path(
        "register/",
        CustomerRegistrationView.as_view(),
        name="customer-register",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),
]