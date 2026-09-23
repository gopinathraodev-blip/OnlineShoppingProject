from django.shortcuts import render

from catalog.models import Category, Product


def home(request):
    categories = (
        Category.objects
        .filter(is_active=True)
        .order_by("name")[:6]
    )

    featured_products = (
        Product.objects
        .filter(
            is_active=True,
            stock_quantity__gt=0
        )
        .select_related("category")
        .order_by("-created_at")[:8]
    )

    context = {
        "categories": categories,
        "featured_products": featured_products,
    }

    return render(
        request,
        "home.html",
        context
    )