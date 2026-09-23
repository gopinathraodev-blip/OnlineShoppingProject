from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404, render

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

def product_list(request):
    category_id = request.GET.get("category")

    products = (
        Product.objects
        .filter(
            is_active=True,
            stock_quantity__gt=0
        )
        .select_related("category")
        .order_by("-created_at")
    )

    if category_id:
        products = products.filter(
            category_id=category_id
        )

    categories = (
        Category.objects
        .filter(is_active=True)
        .order_by("name")
    )

    context = {
        "products": products,
        "categories": categories,
        "selected_category": category_id,
    }

    return render(
        request,
        "catalog/product_list.html",
        context
    )


def product_detail(request, product_id):
    product = get_object_or_404(
        Product.objects.select_related("category"),
        id=product_id,
        is_active=True
    )

    return render(
        request,
        "catalog/product_detail.html",
        {"product": product}
    )