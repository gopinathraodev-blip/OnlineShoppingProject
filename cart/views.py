from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Customer
from catalog.models import Product

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer


class CartDetailView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        customer = get_object_or_404(
            Customer,
            user=self.request.user
        )

        cart, created = Cart.objects.get_or_create(
            customer=customer
        )

        return (
            Cart.objects
            .select_related("customer")
            .prefetch_related("items__product")
            .get(pk=cart.pk)
        )


class CartItemCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = get_object_or_404(
            Customer,
            user=request.user
        )

        cart, created = Cart.objects.get_or_create(
            customer=customer
        )

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]

        existing_item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        if existing_item:
            new_quantity = existing_item.quantity + quantity

            if new_quantity > product.stock_quantity:
                return Response(
                    {
                        "detail": (
                            f"Only {product.stock_quantity} "
                            "items are available in stock."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            existing_item.quantity = new_quantity
            existing_item.save()

            response_serializer = self.get_serializer(
                existing_item
            )

            return Response(
                response_serializer.data,
                status=status.HTTP_200_OK
            )

        if quantity > product.stock_quantity:
            return Response(
                {
                    "detail": (
                        f"Only {product.stock_quantity} "
                        "items are available in stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity
        )

        response_serializer = self.get_serializer(
            cart_item
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class CartItemUpdateView(generics.UpdateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "put"]

    def get_queryset(self):
        return (
            CartItem.objects
            .select_related("cart", "cart__customer", "product")
            .filter(
                cart__customer__user=self.request.user
            )
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {
                    "detail": "Quantity is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {
                    "detail": "Quantity must be a valid integer."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {
                    "detail": "Quantity must be at least 1."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > instance.product.stock_quantity:
            return Response(
                {
                    "detail": (
                        f"Only {instance.product.stock_quantity} "
                        "items are available in stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.quantity = quantity
        instance.save()

        serializer = self.get_serializer(instance)

        return Response(serializer.data)


class CartItemDeleteView(generics.DestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            CartItem.objects
            .select_related("cart", "cart__customer", "product")
            .filter(
                cart__customer__user=self.request.user
            )
        )