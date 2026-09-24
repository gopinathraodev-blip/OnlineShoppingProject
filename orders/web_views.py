from django.shortcuts import render


def checkout_page(request):
    return render(
        request,
        "orders/checkout.html"
    )


def order_list_page(request):
    return render(
        request,
        "orders/order_list.html"
    )


def order_detail_page(request, order_id):
    return render(
        request,
        "orders/order_detail.html",
        {"order_id": order_id}
    )