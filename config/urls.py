from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from .views import home


urlpatterns = [
    path("", home, name="home"),
    path("", include("catalog.web_urls"),),
    path("", include("cart.web_urls"),),
    path("", include("orders.web_urls"),),
    path("admin/", admin.site.urls),
    path("api/catalog/", include("catalog.urls")),
    path("api/accounts/",include("accounts.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/orders/",include("orders.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )