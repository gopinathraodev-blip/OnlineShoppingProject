from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import Customer


User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        max_length=150
    )
    email = serializers.EmailField(
        source="user.email",
        required=True
    )
    first_name = serializers.CharField(
        source="user.first_name",
        required=False,
        allow_blank=True
    )
    last_name = serializers.CharField(
        source="user.last_name",
        required=False,
        allow_blank=True
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = Customer
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "phone_number",
            "address",
            "city",
            "state",
            "postal_code",
            "country",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )
        return value

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=user_data["username"],
            email=user_data["email"],
            first_name=user_data.get("first_name", ""),
            last_name=user_data.get("last_name", ""),
            password=password,
        )

        customer = Customer.objects.create(
            user=user,
            **validated_data
        )

        return customer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(
            username=username,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user
        return attrs