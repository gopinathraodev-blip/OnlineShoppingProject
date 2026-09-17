from django.contrib import admin
from .models import Cart, CartItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "created_at",
        "updated_at",
    )
    search_fields = ("customer__user__username",)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "cart",
        "product",
        "quantity",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "cart__customer__user__username",
        "product__name",
        "product__sku",
    )