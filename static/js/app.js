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


async function loadCheckout() {

    const summary =
        document.getElementById("checkoutSummary");

    if (!summary) {
        return;
    }

    const token =
        localStorage.getItem("authToken");

    if (!token) {

        window.location.href =
            "/api/accounts/login-page/";

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

        const data =
            await response.json();

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

        if (!data.items || data.items.length === 0) {

            summary.innerHTML = `
                <div class="text-center">
                    <p class="text-muted">
                        Your cart is empty.
                    </p>

                    <a
                        href="/products/"
                        class="btn btn-primary"
                    >
                        Continue Shopping
                    </a>
                </div>
            `;

            return;
        }

        let html = "";

        data.items.forEach(function (item) {

            html += `
                <div class="d-flex
                            justify-content-between
                            mb-3">

                    <div>
                        <div class="fw-semibold">
                            ${escapeHtml(
                                item.product_name
                            )}
                        </div>

                        <small class="text-muted">
                            ${item.quantity} ×
                            ₹${item.unit_price}
                        </small>
                    </div>

                    <strong>
                        ₹${item.subtotal}
                    </strong>

                </div>
            `;
        });

        html += `
            <hr>

            <div class="d-flex
                        justify-content-between">

                <strong>
                    Total
                </strong>

                <strong class="text-primary">
                    ₹${data.total_amount}
                </strong>

            </div>
        `;

        summary.innerHTML = html;

    } catch (error) {

        summary.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


async function submitCheckout(event) {

    event.preventDefault();

    const token =
        localStorage.getItem("authToken");

    const message =
        document.getElementById("checkoutMessage");

    if (!token) {

        window.location.href =
            "/api/accounts/login-page/";

        return;
    }


    const payload = {
        shipping_address:
            document.getElementById(
                "shipping_address"
            ).value,

        shipping_city:
            document.getElementById(
                "shipping_city"
            ).value,

        shipping_state:
            document.getElementById(
                "shipping_state"
            ).value,

        shipping_postal_code:
            document.getElementById(
                "shipping_postal_code"
            ).value,

        shipping_country:
            document.getElementById(
                "shipping_country"
            ).value
    };


    try {

        const response = await fetch(
            "/api/orders/checkout/",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Token " + token
                },

                body: JSON.stringify(payload)
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            localStorage.removeItem("authToken");
            localStorage.removeItem("username");

            window.location.href =
                "/api/accounts/login-page/";

            return;
        }


        if (!response.ok) {

            const errors =
                Object.values(data).flat();

            message.className =
                "alert alert-danger";

            message.textContent =
                errors.length
                    ? errors.join(" ")
                    : "Unable to place order.";

            return;
        }


        message.className =
            "alert alert-success";

        message.textContent =
            "Order placed successfully!";


        setTimeout(function () {

            window.location.href =
                `/orders/${data.id}/`;

        }, 800);


    } catch (error) {

        message.className =
            "alert alert-danger";

        message.textContent =
            "Unable to connect to the server.";
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadCheckout();

        const checkoutForm =
            document.getElementById(
                "checkoutForm"
            );

        if (checkoutForm) {

            checkoutForm.addEventListener(
                "submit",
                submitCheckout
            );
        }

    }
);

async function loadOrders() {

    const container =
        document.getElementById("ordersContent");

    if (!container) {
        return;
    }

    const token =
        localStorage.getItem("authToken");

    if (!token) {

        window.location.href =
            "/api/accounts/login-page/";

        return;
    }


    try {

        const response = await fetch(
            "/api/orders/",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Token " + token
                }
            }
        );


        const data =
            await response.json();


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
                "Unable to load orders."
            );
        }


        if (!data.length) {

            container.innerHTML = `
                <div class="text-center py-5">

                    <h4>
                        No orders yet
                    </h4>

                    <p class="text-muted">
                        Your completed orders will appear here.
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


        let html = "";


        data.forEach(function (order) {

            html += `
                <div class="card shadow-sm mb-3">

                    <div class="card-body">

                        <div class="row
                                    align-items-center">

                            <div class="col-md-3">

                                <small class="text-muted">
                                    Order Number
                                </small>

                                <div class="fw-bold">
                                    ${escapeHtml(
                                        order.order_number
                                    )}
                                </div>

                            </div>


                            <div class="col-md-2">

                                <small class="text-muted">
                                    Status
                                </small>

                                <div>
                                    <span class="badge bg-primary">
                                        ${escapeHtml(
                                            order.status
                                        )}
                                    </span>
                                </div>

                            </div>


                            <div class="col-md-2">

                                <small class="text-muted">
                                    Total
                                </small>

                                <div class="fw-bold">
                                    ₹${order.total_amount}
                                </div>

                            </div>


                            <div class="col-md-3">

                                <small class="text-muted">
                                    Date
                                </small>

                                <div>
                                    ${new Date(
                                        order.created_at
                                    ).toLocaleString()}
                                </div>

                            </div>


                            <div class="col-md-2 text-md-end">

                                <a
                                    href="/orders/${order.id}/"
                                    class="btn btn-outline-primary"
                                >
                                    View
                                </a>

                            </div>

                        </div>

                    </div>

                </div>
            `;
        });


        container.innerHTML = html;


    } catch (error) {

        container.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


async function loadOrderDetail() {

    const container =
        document.getElementById(
            "orderDetailContent"
        );

    if (!container) {
        return;
    }


    const token =
        localStorage.getItem("authToken");


    if (!token) {

        window.location.href =
            "/api/accounts/login-page/";

        return;
    }


    try {

        const response = await fetch(
            `/api/orders/${orderId}/`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Token " + token
                }
            }
        );


        const data =
            await response.json();


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
                "Unable to load order."
            );
        }


        let itemsHTML = "";


        data.items.forEach(function (item) {

            itemsHTML += `
                <tr>

                    <td>
                        ${escapeHtml(
                            item.product_name
                        )}
                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ₹${item.unit_price}
                    </td>

                    <td>
                        ₹${item.subtotal}
                    </td>

                </tr>
            `;
        });


        container.innerHTML = `

            <div class="card shadow-sm mb-4">

                <div class="card-body">

                    <div class="row">

                        <div class="col-md-6">

                            <h5 class="fw-bold">
                                ${escapeHtml(
                                    data.order_number
                                )}
                            </h5>

                            <p class="mb-1">
                                Status:
                                <span class="badge bg-primary">
                                    ${escapeHtml(
                                        data.status
                                    )}
                                </span>
                            </p>

                            <p class="mb-0 text-muted">
                                ${new Date(
                                    data.created_at
                                ).toLocaleString()}
                            </p>

                        </div>


                        <div class="col-md-6">

                            <h6 class="fw-bold">
                                Shipping Address
                            </h6>

                            <p class="text-muted">
                                ${escapeHtml(
                                    data.shipping_address
                                )}<br>
                                ${escapeHtml(
                                    data.shipping_city
                                )},
                                ${escapeHtml(
                                    data.shipping_state
                                )}<br>
                                ${escapeHtml(
                                    data.shipping_postal_code
                                )},
                                ${escapeHtml(
                                    data.shipping_country
                                )}
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            <div class="card shadow-sm">

                <div class="card-body">

                    <h5 class="fw-bold mb-4">
                        Order Items
                    </h5>

                    <div class="table-responsive">

                        <table class="table">

                            <thead>

                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                </tr>

                            </thead>

                            <tbody>
                                ${itemsHTML}
                            </tbody>

                        </table>

                    </div>


                    <div class="text-end">

                        <h4 class="fw-bold">
                            Total:
                            <span class="text-primary">
                                ₹${data.total_amount}
                            </span>
                        </h4>

                    </div>

                </div>

            </div>
        `;


    } catch (error) {

        container.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadOrders();
        loadOrderDetail();

    }
);


async function logoutUser() {

    const token =
        localStorage.getItem("authToken");

    if (!token) {
        window.location.href = "/";
        return;
    }

    try {

        const response = await fetch(
            "/api/accounts/logout/",
            {
                method: "POST",
                headers: {
                    "Authorization":
                        "Token " + token
                }
            }
        );

        // Remove browser-side authentication data
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");

        if (response.ok || response.status === 401) {
            window.location.href = "/";
            return;
        }

        alert("Unable to logout. Please try again.");

    } catch (error) {

        // Even if the server is unavailable,
        // clear the browser token.
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");

        window.location.href = "/";
    }
}


function updateNavbar() {

    const token =
        localStorage.getItem("authToken");

    const loginNavItem =
        document.getElementById("loginNavItem");

    const registerNavItem =
        document.getElementById("registerNavItem");

    const logoutNavItem =
        document.getElementById("logoutNavItem");


    if (!loginNavItem ||
        !registerNavItem ||
        !logoutNavItem) {
        return;
    }


    if (token) {

        loginNavItem.classList.add("d-none");
        registerNavItem.classList.add("d-none");
        logoutNavItem.classList.remove("d-none");

    } else {

        loginNavItem.classList.remove("d-none");
        registerNavItem.classList.remove("d-none");
        logoutNavItem.classList.add("d-none");
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        updateNavbar();
    }
);