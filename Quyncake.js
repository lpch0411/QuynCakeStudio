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

// Initialize cart rendering on page load
loadCart();
renderCart();
