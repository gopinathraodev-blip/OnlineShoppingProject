from django.urls import path

from .views import (
    login_page,
    profile_page,
    register_page,
)


urlpatterns = [
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

    path(
        "profile/",
        profile_page,
        name="profile-page",
    ),
]