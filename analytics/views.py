import csv

from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import render
from django.utils.dateparse import parse_date

from accounts.models import Customer
from catalog.models import Product
from orders.models import Order, OrderItem


@staff_member_required
def dashboard(request):
    start_date_value = request.GET.get("start_date", "").strip()
    end_date_value = request.GET.get("end_date", "").strip()

    start_date = parse_date(start_date_value) if start_date_value else None
    end_date = parse_date(end_date_value) if end_date_value else None

    valid_dates = not (
        start_date and end_date and start_date > end_date
    )

    valid_orders = Order.objects.exclude(
        status=Order.OrderStatus.CANCELLED
    )

    all_orders = Order.objects.all()

    if valid_dates:
        if start_date:
            valid_orders = valid_orders.filter(
                created_at__date__gte=start_date
            )
            all_orders = all_orders.filter(
                created_at__date__gte=start_date
            )

        if end_date:
            valid_orders = valid_orders.filter(
                created_at__date__lte=end_date
            )
            all_orders = all_orders.filter(
                created_at__date__lte=end_date
            )

    total_revenue = (
        valid_orders.aggregate(total=Sum("total_amount"))["total"]
        or 0
    )

    total_orders = valid_orders.count()
    total_customers = Customer.objects.count()
    total_products = Product.objects.filter(is_active=True).count()

    monthly_sales = (
        valid_orders
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(
            revenue=Sum("total_amount"),
            order_count=Count("id"),
        )
        .order_by("month")
    )

    sales_labels = [
        item["month"].strftime("%b %Y")
        for item in monthly_sales
    ]

    sales_revenue = [
        float(item["revenue"] or 0)
        for item in monthly_sales
    ]

    sales_order_counts = [
        item["order_count"]
        for item in monthly_sales
    ]

    best_selling_products = (
        OrderItem.objects
        .filter(order__in=valid_orders)
        .values("product__name")
        .annotate(
            units_sold=Sum("quantity"),
            revenue=Sum("subtotal"),
        )
        .order_by("-units_sold")[:5]
    )

    
    # Product performance grouped by category
    category_performance = (
        OrderItem.objects
        .filter(order__in=valid_orders)
        .values("product__category__name")
        .annotate(
            revenue=Sum("subtotal"),
            units_sold=Sum("quantity"),
        )
        .order_by("-revenue")
    )
    

    low_stock_products = Product.objects.filter(
        is_active=True,
        stock_quantity__lte=5,
    ).order_by("stock_quantity", "name")[:10]

    order_statuses = (
        all_orders
        .values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    status_display = dict(Order.OrderStatus.choices)

    order_status_labels = [
        status_display.get(item["status"], item["status"])
        for item in order_statuses
    ]

    order_status_counts = [
        item["count"]
        for item in order_statuses
    ]

    context = {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "sales_labels": sales_labels,
        "sales_revenue": sales_revenue,
        "sales_order_counts": sales_order_counts,
        "best_selling_products": best_selling_products,
        "low_stock_products": low_stock_products,
        "order_statuses": order_statuses,
        "order_status_labels": order_status_labels,
        "order_status_counts": order_status_counts,
        "category_performance": category_performance,
        "selected_start_date": (
            start_date.isoformat() if start_date and valid_dates else ""
        ),
        "selected_end_date": (
            end_date.isoformat() if end_date and valid_dates else ""
        ),
        "invalid_date_range": not valid_dates,
    }

    return render(request, "analytics/dashboard.html", context)



@staff_member_required
def export_sales_csv(request):
    start_date_value = request.GET.get("start_date", "").strip()
    end_date_value = request.GET.get("end_date", "").strip()

    start_date = parse_date(start_date_value) if start_date_value else None
    end_date = parse_date(end_date_value) if end_date_value else None

    # Reject invalid date inputs.
    if start_date_value and start_date is None:
        return HttpResponseBadRequest("Invalid start date.")

    if end_date_value and end_date is None:
        return HttpResponseBadRequest("Invalid end date.")

    if start_date and end_date and start_date > end_date:
        return HttpResponseBadRequest(
            "Start date cannot be later than end date."
        )

    # Exclude cancelled orders to match the dashboard sales totals.
    orders = (
        Order.objects
        .exclude(status=Order.OrderStatus.CANCELLED)
        .select_related("customer__user")
        .order_by("-created_at")
    )

    if start_date:
        orders = orders.filter(created_at__date__gte=start_date)

    if end_date:
        orders = orders.filter(created_at__date__lte=end_date)

    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = (
        'attachment; filename="sales_report.csv"'
    )

    # Helps Excel display UTF-8 text correctly.
    response.write("\ufeff")

    writer = csv.writer(response)

    writer.writerow([
        "Order Number",
        "Order Date",
        "Order Status",
        "Customer Username",
        "Order Amount",
    ])

    for order in orders:
        writer.writerow([
            order.order_number,
            order.created_at.strftime("%Y-%m-%d %H:%M"),
            order.get_status_display(),
            order.customer.user.username,
            order.total_amount,
        ])

    return response