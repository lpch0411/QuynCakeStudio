const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const clearCartBtn = document.querySelector(".clear-cart");

// Cart object: { productName: {price, quantity} }
let cart = {};

// Load cart from localStorage
const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch {
            cart = {};
        }
    }
};

// Save cart to localStorage
const saveCart = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

// Format price with comma separators
const formatPrice = price => price.toLocaleString();

// Calculate total price
const calculateTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Render cart items on the page
const renderCart = () => {
    cartItemsEl.innerHTML = "";
    if (Object.keys(cart).length === 0) {
        cartItemsEl.innerHTML = '<li style="text-align:center; color:#777;">Your cart is empty</li>';
        cartTotalEl.textContent = '0';
        return;
    }
    for (const [name, { price, quantity }] of Object.entries(cart)) {
        const li = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.className = "item-name";
        nameSpan.textContent = name;

        const quantityControls = document.createElement("div");
        quantityControls.className = "quantity-control";

        const btnMinus = document.createElement("button");
        btnMinus.textContent = "−";
        btnMinus.setAttribute("aria-label", `Decrease quantity of ${name}`);
        btnMinus.onclick = () => {
            if (cart[name].quantity > 1) {
                cart[name].quantity--;
            } else {
                delete cart[name];
            }
            saveCart();
            renderCart();
        };

        const quantitySpan = document.createElement("span");
        quantitySpan.textContent = quantity;

        const btnPlus = document.createElement("button");
        btnPlus.textContent = "+";
        btnPlus.setAttribute("aria-label", `Increase quantity of ${name}`);
        btnPlus.onclick = () => {
            cart[name].quantity++;
            saveCart();
            renderCart();
        };

        quantityControls.appendChild(btnMinus);
        quantityControls.appendChild(quantitySpan);
        quantityControls.appendChild(btnPlus);

        const priceSpan = document.createElement("span");
        priceSpan.className = "item-price";
        priceSpan.textContent = formatPrice(price * quantity) + "đ";

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-item";
        removeBtn.setAttribute("aria-label", `Remove ${name} from cart`);
        removeBtn.textContent = "×";
        removeBtn.onclick = () => {
            delete cart[name];
            saveCart();
            renderCart();
        };

        li.appendChild(nameSpan);
        li.appendChild(quantityControls);
        li.appendChild(priceSpan);
        li.appendChild(removeBtn);
        cartItemsEl.appendChild(li);
    }
    cartTotalEl.textContent = formatPrice(calculateTotal());
};

// Add product to cart or increment quantity
const addToCart = (name, price) => {
    if (cart[name]) {
        cart[name].quantity++;
    } else {
        cart[name] = { price: price, quantity: 1 };
    }
    saveCart();
    renderCart();
};

// Clear entire cart
clearCartBtn.addEventListener("click", () => {
    cart = {};
    saveCart();
    renderCart();
});

// Attach add-to-cart button handlers
document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
        const name = button.getAttribute("data-name");
        const price = parseInt(button.getAttribute("data-price"));
        addToCart(name, price);
    });
});

const showShopMessage = (msg, isError = false) => {
    let el = document.getElementById("shop-msg");
    if (!el) {
        el = document.createElement("div");
        el.id = "shop-msg";
        el.style.textAlign = "center";
        el.style.margin = "12px 0";
        el.style.color = isError ? "red" : "green";
        const shopSection = document.getElementById("shop") || document.body;
        shopSection.parentElement.insertBefore(el, shopSection.nextSibling);
    }
    el.style.color = isError ? "red" : "green";
    el.textContent = msg;
    setTimeout(() => { el.textContent = ""; }, 4000);
};

const loadCakesToShop = async () => {
    const fillCategorySection = async (category, containerId) => {
        try {
            const res = await fetch(`/api/cakes?category=${encodeURIComponent(category)}`);
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }
            const cakes = await res.json();
            const container = document.getElementById(containerId);
            container.innerHTML = "";

            if (cakes.length === 0) {
                container.innerHTML = `<p style="color: #777;">No ${category} available at the moment.</p>`;
                return;
            }

            cakes.forEach(cake => {
                const card = document.createElement("div");
                card.className = "product-card";
                card.innerHTML = `
                    <img src="${cake.image || 'img/placeholder.jpg'}" alt="${cake.name}">
                    <h3>${cake.name}</h3>
                    <p class="description">${cake.description}</p>
                    <p class="price" >${Number(cake.price).toLocaleString()}đ</p><br>
                    <button class="add-to-cart" data-name="${cake.name}" data-price="${cake.price}">Add to Cart</button>
                `;
                container.appendChild(card);
            });

            // Re-bind add-to-cart button events
            container.querySelectorAll(".add-to-cart").forEach(button => {
                button.addEventListener("click", () => {
                    const name = button.getAttribute("data-name");
                    const price = parseInt(button.getAttribute("data-price"));
                    addToCart(name, price);
                });
            });
        } catch (error) {
            console.error(`❌ Failed to load ${category}:`, error);
            showShopMessage(`Failed to load ${category}. Please try again later.`, true);
            const container = document.getElementById(containerId);
            container.innerHTML = `<p style="color: red;">Error loading cakes.</p>`;
        }
    };

    await fillCategorySection("Bento Cake", "bento-cakes");
    await fillCategorySection("Birthday Cake", "birthday-cakes");
};

//hamburger menu
function myFunction() {
  var x = document.getElementById("myLinks");
  if (x.style.display === "block") {
    x.style.display = "none";
  } else {
    x.style.display = "block";
  }
}

// Show/hide order modal
const orderNowBtn = document.querySelector(".order-now");
const orderModal = document.getElementById("order-modal");
const cancelOrderBtn = document.getElementById("cancel-order-btn");
const submitOrderBtn = document.getElementById("submit-order-btn");
const orderFeedback = document.getElementById("order-feedback");

orderNowBtn.onclick = () => {
    if (Object.keys(cart).length === 0) {
        alert("Your cart is empty.");
        return;
    }
    orderModal.style.display = "flex";
    orderFeedback.textContent = "";
    document.getElementById("customer-phone").value = "";
};

cancelOrderBtn.onclick = () => {
    orderModal.style.display = "none";
};

submitOrderBtn.onclick = async () => {
    const phone = document.getElementById("customer-phone").value.trim();
    // Validate: must be 10 digits, starts with 0, only numbers
    if (!/^0\d{9}$/.test(phone)) {
        orderFeedback.textContent = "Please enter a valid phone number.";
        orderFeedback.style.color = "red";
        return;
    }
    // Send order
    try {
        const res = await fetch("/api/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cart,
                phone
            })
        });
        if (res.ok) {
            orderFeedback.textContent = "Thank you! Your order was sent. We will contact you soon.";
            orderFeedback.style.color = "green";
            cart = {};
            saveCart();
            renderCart();
            setTimeout(() => {
                orderModal.style.display = "none";
            }, 1200);
        } else {
            orderFeedback.textContent = "Failed to send order. Please try again.";
            orderFeedback.style.color = "red";
        }
    } catch {
        orderFeedback.textContent = "Network error.";
        orderFeedback.style.color = "red";
    }
};


// Initialize cart rendering on page load
loadCart();
renderCart();
loadCakesToShop();
