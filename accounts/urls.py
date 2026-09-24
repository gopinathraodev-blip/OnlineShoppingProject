from django.urls import path

from .views import (
    CustomerRegistrationView,
    LoginView,
    LogoutView,
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

    path(
    "logout/",
    LogoutView.as_view(),
    name="logout",
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