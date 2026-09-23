from django.urls import path

from .views import (
    CustomerRegistrationView,
    LoginView,
    login_page,
    register_page,
)


urlpatterns = [
    # API
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

    # HTML pages
    path(
        "login-page/",
        login_page,
        name="login-page",
    ),
    path(
        "register-page/",
        register_page,
        name="register-page",
    ),
]