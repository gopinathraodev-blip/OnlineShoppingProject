import uuid
from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Customer
from cart.models import Cart

from .models import Order, OrderItem
from .serializers import OrderSerializer


class CheckoutSerializer(serializers.Serializer):
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=10)
    shipping_country = serializers.CharField(
        max_length=100,
        default="India"
    )


class CheckoutView(generics.GenericAPIView):
    serializer_class = CheckoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = get_object_or_404(
            Customer,
            user=request.user
        )

        cart = (
            Cart.objects
            .prefetch_related("items__product")
            .filter(customer=customer)
            .first()
        )

        if not cart:
            return Response(
                {
                    "detail": "Cart does not exist."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_items = list(cart.items.all())

        if not cart_items:
            return Response(
                {
                    "detail": "Your cart is empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            product_ids = [
                item.product_id
                for item in cart_items
            ]

            from catalog.models import Product

            products = (
                Product.objects
                .select_for_update()
                .filter(id__in=product_ids)
            )

            product_map = {
                product.id: product
                for product in products
            }

            total_amount = Decimal("0.00")

            for cart_item in cart_items:
                product = product_map.get(
                    cart_item.product_id
                )

                if product is None:
                    return Response(
                        {
                            "detail": (
                                f"Product ID "
                                f"{cart_item.product_id} "
                                "no longer exists."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not product.is_active:
                    return Response(
                        {
                            "detail": (
                                f"{product.name} is currently "
                                "not available."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if cart_item.quantity > product.stock_quantity:
                    return Response(
                        {
                            "detail": (
                                f"Only {product.stock_quantity} "
                                f"units of {product.name} "
                                "are available."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                total_amount += (
                    product.price * cart_item.quantity
                )

            order = Order.objects.create(
                customer=customer,
                order_number=(
                    f"ORD-{uuid.uuid4().hex[:12].upper()}"
                ),
                status=Order.OrderStatus.PENDING,
                total_amount=total_amount,
                shipping_address=serializer.validated_data[
                    "shipping_address"
                ],
                shipping_city=serializer.validated_data[
                    "shipping_city"
                ],
                shipping_state=serializer.validated_data[
                    "shipping_state"
                ],
                shipping_postal_code=serializer.validated_data[
                    "shipping_postal_code"
                ],
                shipping_country=serializer.validated_data[
                    "shipping_country"
                ],
            )

            order_items = []

            for cart_item in cart_items:
                product = product_map[
                    cart_item.product_id
                ]

                subtotal = (
                    product.price * cart_item.quantity
                )

                order_items.append(
                    OrderItem(
                        order=order,
                        product=product,
                        quantity=cart_item.quantity,
                        unit_price=product.price,
                        subtotal=subtotal,
                    )
                )

                product.stock_quantity -= cart_item.quantity
                product.save(
                    update_fields=[
                        "stock_quantity",
                        "updated_at",
                    ]
                )

            OrderItem.objects.bulk_create(order_items)

            cart.items.all().delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(
                customer__user=self.request.user
            )
            .prefetch_related(
                "items__product"
            )
            .order_by("-created_at")
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(
                customer__user=self.request.user
            )
            .prefetch_related(
                "items__product"
            )
        )