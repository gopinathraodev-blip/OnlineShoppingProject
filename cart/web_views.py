from django.shortcuts import render


def cart_page(request):
    return render(request, "cart/cart_detail.html")