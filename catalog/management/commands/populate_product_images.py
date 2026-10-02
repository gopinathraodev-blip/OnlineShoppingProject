from io import BytesIO
from pathlib import Path
import hashlib

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from PIL import Image, ImageDraw, ImageFont

from catalog.models import Product


class Command(BaseCommand):
    help = "Generate and assign placeholder images to all products."

    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Replace existing product images as well.",
        )

    def get_font(self, size):
        """
        Try common fonts. Fall back to Pillow's default font.
        """
        possible_fonts = [
            Path(r"C:\Windows\Fonts\arial.ttf"),
            Path(r"C:\Windows\Fonts\segoeui.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ]

        for font_path in possible_fonts:
            if font_path.exists():
                try:
                    return ImageFont.truetype(str(font_path), size)
                except OSError:
                    pass

        return ImageFont.load_default()

    def wrap_text(self, draw, text, font, max_width):
        """
        Wrap text so long product names fit inside the image.
        """
        words = text.split()
        lines = []
        current_line = ""

        for word in words:
            test_line = f"{current_line} {word}".strip()
            bbox = draw.textbbox((0, 0), test_line, font=font)
            width = bbox[2] - bbox[0]

            if width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word

        if current_line:
            lines.append(current_line)

        return lines

    def create_product_image(self, product):
        width = 1200
        height = 1200

        # Generate a repeatable background based on product ID.
        digest = hashlib.md5(
            str(product.id).encode("utf-8")
        ).hexdigest()

        r = int(digest[0:2], 16)
        g = int(digest[2:4], 16)
        b = int(digest[4:6], 16)

        background = (
            max(40, r),
            max(40, g),
            max(40, b),
        )

        image = Image.new(
            "RGB",
            (width, height),
            background,
        )

        draw = ImageDraw.Draw(image)

        title_font = self.get_font(72)
        category_font = self.get_font(42)
        price_font = self.get_font(52)

        # Product name
        product_name = product.name

        lines = self.wrap_text(
            draw,
            product_name,
            title_font,
            950,
        )

        line_heights = []

        for line in lines:
            bbox = draw.textbbox(
                (0, 0),
                line,
                font=title_font,
            )
            line_heights.append(
                bbox[3] - bbox[1]
            )

        total_text_height = sum(line_heights) + (
            20 * max(0, len(lines) - 1)
        )

        y = (height - total_text_height) // 2 - 80

        for index, line in enumerate(lines):
            bbox = draw.textbbox(
                (0, 0),
                line,
                font=title_font,
            )

            text_width = bbox[2] - bbox[0]

            x = (width - text_width) // 2

            draw.text(
                (x, y),
                line,
                fill="white",
                font=title_font,
            )

            y += line_heights[index] + 20

        # Category
        category_text = product.category.name

        bbox = draw.textbbox(
            (0, 0),
            category_text,
            font=category_font,
        )

        category_width = bbox[2] - bbox[0]

        draw.text(
            (
                (width - category_width) // 2,
                820,
            ),
            category_text,
            fill="white",
            font=category_font,
        )

        # Price
        price_text = f"₹{product.price}"

        bbox = draw.textbbox(
            (0, 0),
            price_text,
            font=price_font,
        )

        price_width = bbox[2] - bbox[0]

        draw.text(
            (
                (width - price_width) // 2,
                900,
            ),
            price_text,
            fill="white",
            font=price_font,
        )

        # Small footer
        footer = "Online Shopping"

        footer_font = self.get_font(32)

        bbox = draw.textbbox(
            (0, 0),
            footer,
            font=footer_font,
        )

        footer_width = bbox[2] - bbox[0]

        draw.text(
            (
                (width - footer_width) // 2,
                1100,
            ),
            footer,
            fill="white",
            font=footer_font,
        )

        # Save image to memory
        image_buffer = BytesIO()

        image.save(
            image_buffer,
            format="JPEG",
            quality=90,
        )

        return image_buffer.getvalue()

    def handle(self, *args, **options):
        overwrite = options["overwrite"]

        products = Product.objects.select_related(
            "category"
        ).order_by("id")

        total = products.count()

        if total == 0:
            self.stdout.write(
                self.style.WARNING(
                    "No products found."
                )
            )
            return

        created = 0
        skipped = 0

        self.stdout.write(
            f"Found {total} products."
        )

        for product in products:

            if product.image and not overwrite:
                skipped += 1

                self.stdout.write(
                    self.style.WARNING(
                        f"SKIPPED: {product.name}"
                    )
                )

                continue

            image_bytes = self.create_product_image(
                product
            )

            filename = (
                f"{product.slug or 'product'}"
                f"-{product.id}.jpg"
            )

            product.image.save(
                filename,
                ContentFile(image_bytes),
                save=False,
            )

            product.save(
                update_fields=[
                    "image",
                    "updated_at",
                ]
            )

            created += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"IMAGE ADDED: {product.name}"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "===================================="
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Products found : {total}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Images created : {created}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Products skipped: {skipped}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "IMAGE POPULATION COMPLETED!"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                "===================================="
            )
        )