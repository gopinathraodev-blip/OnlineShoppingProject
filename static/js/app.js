console.log("Online Shopping application loaded successfully.");


document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const username =
                document.getElementById("username").value;

            const password =
                document.getElementById("password").value;

            const message =
                document.getElementById("loginMessage");

            try {

                const response = await fetch(
                    "/api/accounts/login/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    }
                );

                const data = await response.json();

                if (response.ok) {

                    localStorage.setItem(
                        "authToken",
                        data.token
                    );

                    localStorage.setItem(
                        "username",
                        data.user.username
                    );

                    message.className =
                        "alert alert-success";

                    message.textContent =
                        "Login successful. Redirecting...";

                    setTimeout(function () {
                        window.location.href = "/";
                    }, 1000);

                } else {

                    message.className =
                        "alert alert-danger";

                    if (data.non_field_errors) {
                        message.textContent =
                            data.non_field_errors.join(", ");
                    } else {
                        message.textContent =
                            "Login failed.";
                    }
                }

            } catch (error) {

                message.className =
                    "alert alert-danger";

                message.textContent =
                    "Unable to connect to the server.";
            }

        });
    }


    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const message =
                    document.getElementById(
                        "registerMessage"
                    );

                try {

                    const response = await fetch(
                        "/api/accounts/register/",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                username:
                                    document.getElementById(
                                        "username"
                                    ).value,

                                email:
                                    document.getElementById(
                                        "email"
                                    ).value,

                                first_name:
                                    document.getElementById(
                                        "first_name"
                                    ).value,

                                last_name:
                                    document.getElementById(
                                        "last_name"
                                    ).value,

                                password:
                                    document.getElementById(
                                        "password"
                                    ).value,

                                phone_number:
                                    document.getElementById(
                                        "phone_number"
                                    ).value,

                                address:
                                    document.getElementById(
                                        "address"
                                    ).value,

                                city:
                                    document.getElementById(
                                        "city"
                                    ).value,

                                state:
                                    document.getElementById(
                                        "state"
                                    ).value,

                                postal_code:
                                    document.getElementById(
                                        "postal_code"
                                    ).value,

                                country:
                                    document.getElementById(
                                        "country"
                                    ).value
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (response.ok) {

                        message.className =
                            "alert alert-success";

                        message.textContent =
                            "Registration successful. Redirecting to login...";

                        setTimeout(function () {
                            window.location.href =
                                "/api/accounts/login-page/";
                        }, 1500);

                    } else {

                        message.className =
                            "alert alert-danger";

                        const errors =
                            Object.values(data).flat();

                        message.textContent =
                            errors.join(" ");

                    }

                } catch (error) {

                    message.className =
                        "alert alert-danger";

                    message.textContent =
                        "Unable to connect to the server.";
                }

            }
        );
    }

});


async function addToCart(productId) {

    const token =
        localStorage.getItem("authToken");

    if (!token) {

        alert(
            "Please login before adding products to your cart."
        );

        window.location.href =
            "/api/accounts/login-page/";

        return;
    }


    const quantityInput =
        document.getElementById("quantity");

    const quantity =
        quantityInput
            ? parseInt(quantityInput.value)
            : 1;


    try {

        const response = await fetch(
            "/api/cart/items/",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Token " + token
                },

                body: JSON.stringify({
                    product: productId,
                    quantity: quantity
                })
            }
        );


        const data = await response.json();


        if (response.ok) {

            alert(
                "Product added to cart successfully."
            );

            window.location.href =
                "/cart/";

        } else {

            if (response.status === 401) {

                localStorage.removeItem(
                    "authToken"
                );

                localStorage.removeItem(
                    "username"
                );

                alert(
                    "Your login session is invalid. Please login again."
                );

                window.location.href =
                    "/api/accounts/login-page/";

                return;
            }

            alert(
                data.detail ||
                "Unable to add product to cart."
            );
        }

    } catch (error) {

        alert(
            "Unable to connect to the server."
        );
    }
}

async function loadCart() {

    const token =
        localStorage.getItem("authToken");

    const cartContent =
        document.getElementById("cartContent");

    const cartMessage =
        document.getElementById("cartMessage");

    if (!cartContent) {
        return;
    }

    if (!token) {

        cartContent.innerHTML = `
            <div class="text-center py-5">
                <h4 class="fw-bold">
                    Please login
                </h4>

                <p class="text-muted">
                    You need to login to view your cart.
                </p>

                <a
                    href="/api/accounts/login-page/"
                    class="btn btn-primary"
                >
                    Login
                </a>
            </div>
        `;

        return;
    }


    try {

        const response = await fetch(
            "/api/cart/",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Token " + token
                }
            }
        );


        const data = await response.json();


        if (response.status === 401) {

            localStorage.removeItem("authToken");
            localStorage.removeItem("username");

            window.location.href =
                "/api/accounts/login-page/";

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load cart."
            );
        }


        displayCart(data);

    } catch (error) {

        cartMessage.className =
            "alert alert-danger";

        cartMessage.textContent =
            error.message;

        cartContent.innerHTML = "";
    }
}


function displayCart(cart) {

    const cartContent =
        document.getElementById("cartContent");

    if (!cart.items || cart.items.length === 0) {

        cartContent.innerHTML = `
            <div class="text-center py-5">

                <div class="fs-1 mb-3">
                    🛒
                </div>

                <h4 class="fw-bold">
                    Your cart is empty
                </h4>

                <p class="text-muted">
                    Add some products to your cart.
                </p>

                <a
                    href="/products/"
                    class="btn btn-primary"
                >
                    Start Shopping
                </a>

            </div>
        `;

        return;
    }


    let itemsHTML = "";


    cart.items.forEach(function (item) {

        const imageUrl =
            "/static/images/product-placeholder.jpg";


        itemsHTML += `
            <div class="card shadow-sm mb-3">

                <div class="card-body">

                    <div class="row align-items-center">

                        <div class="col-md-2 text-center">

                            <img
                                src="${imageUrl}"
                                alt="${escapeHtml(item.product_name)}"
                                class="img-fluid cart-product-image"
                            >

                        </div>


                        <div class="col-md-3">

                            <h5 class="fw-bold mb-1">
                                ${escapeHtml(item.product_name)}
                            </h5>

                            <p class="text-muted mb-0">
                                Unit Price:
                                ₹${item.unit_price}
                            </p>

                        </div>


                        <div class="col-md-3">

                            <label
                                class="form-label small text-muted"
                            >
                                Quantity
                            </label>

                            <div class="input-group">

                                <button
                                    class="btn btn-outline-secondary"
                                    onclick="updateCartItem(
                                        ${item.id},
                                        ${item.quantity - 1}
                                    )"
                                >
                                    -
                                </button>

                                <input
                                    type="text"
                                    class="form-control text-center"
                                    value="${item.quantity}"
                                    readonly
                                >

                                <button
                                    class="btn btn-outline-secondary"
                                    onclick="updateCartItem(
                                        ${item.id},
                                        ${item.quantity + 1}
                                    )"
                                >
                                    +
                                </button>

                            </div>

                        </div>


                        <div class="col-md-2 text-center">

                            <h5 class="fw-bold text-primary">
                                ₹${item.subtotal}
                            </h5>

                        </div>


                        <div class="col-md-2 text-center">

                            <button
                                class="btn btn-outline-danger"
                                onclick="deleteCartItem(
                                    ${item.id}
                                )"
                            >
                                Remove
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        `;
    });


    cartContent.innerHTML = `

        <div class="row">

            <div class="col-lg-8">

                ${itemsHTML}

            </div>


            <div class="col-lg-4">

                <div class="card shadow-sm">

                    <div class="card-body">

                        <h4 class="fw-bold mb-4">
                            Cart Summary
                        </h4>


                        <div class="d-flex
                                    justify-content-between
                                    mb-3">

                            <span>
                                Total
                            </span>

                            <strong class="text-primary">
                                ₹${cart.total_amount}
                            </strong>

                        </div>


                        <hr>


                        <button
                            class="btn btn-primary w-100"
                            onclick="proceedToCheckout()"
                        >
                            Proceed to Checkout
                        </button>


                        <a
                            href="/products/"
                            class="btn btn-outline-dark w-100 mt-2"
                        >
                            Continue Shopping
                        </a>

                    </div>

                </div>

            </div>

        </div>
    `;
}


async function updateCartItem(itemId, quantity) {

    if (quantity < 1) {
        return;
    }


    const token =
        localStorage.getItem("authToken");


    try {

        const response = await fetch(
            `/api/cart/items/${itemId}/`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Token " + token
                },

                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );


        const data = await response.json();


        if (response.status === 401) {

            localStorage.removeItem("authToken");
            localStorage.removeItem("username");

            window.location.href =
                "/api/accounts/login-page/";

            return;
        }


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to update cart item."
            );

            return;
        }


        await loadCart();

    } catch (error) {

        alert(
            "Unable to connect to the server."
        );
    }
}


async function deleteCartItem(itemId) {

    const token =
        localStorage.getItem("authToken");


    try {

        const response = await fetch(
            `/api/cart/items/${itemId}/delete/`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        "Token " + token
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("authToken");
            localStorage.removeItem("username");

            window.location.href =
                "/api/accounts/login-page/";

            return;
        }


        if (!response.ok) {

            const data =
                await response.json();

            alert(
                data.detail ||
                "Unable to remove item."
            );

            return;
        }


        await loadCart();

    } catch (error) {

        alert(
            "Unable to connect to the server."
        );
    }
}


function proceedToCheckout() {

    window.location.href =
        "/checkout/";
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCart();

    }
);