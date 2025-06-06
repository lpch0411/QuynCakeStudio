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
  showToast(`${name} đã được thêm vào giỏ hàng!`);
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
    showSpinner();
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
                    <button class="add-to-cart" data-name="${cake.name}" data-price="${cake.price}">Thêm vào giỏ</button>
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
        hideSpinner();
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
  showToast("Giỏ hàng của bạn đang trống!", true);
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
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const orderType = document.getElementById("order-type").value;
  const pickupDatetime = document.getElementById("pickup-datetime").value;
  const address = document.getElementById("delivery-address").value.trim();

  if (new Date(pickupDatetime) < new Date()) {
    showToast("Vui lòng chọn ngày/giờ.", true);
    return;
  }

  if (!name || !phone || !email || !pickupDatetime) {
    showToast("Vui lòng điền đầy đủ thông tin.", true);
    return;
  }
  if (orderType === "delivery" && !address) {
    showToast("Vui lòng nhập địa chỉ giao hàng.", true);
    return;
  }

  showSpinner();
  try {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart,
        name,
        phone,
        email,
        orderType,
        pickupDatetime,
        address: orderType === "delivery" ? address : ""
      })
    });

    if (res.ok) {
      showToast("Cảm ơn bạn! Đơn hàng đã được gửi.", false);
      cart = {};
      saveCart();
      renderCart();
      setTimeout(() => { orderModal.style.display = "none"; }, 1200);
    } else {
      showToast("Gửi đơn hàng thất bại. Vui lòng thử lại.", true);
    }
  } catch {
    showToast("Lỗi mạng. Vui lòng kiểm tra kết nối.", true);
  } finally {
    hideSpinner();
  }
};

// const fillCartBtn = document.getElementById("fill-cart-btn");
// if (fillCartBtn) {
//     fillCartBtn.addEventListener("click", () => {
//         // Fill the cart with mock cakes
//         cart = {
//             "Chocolate Dream": { price: 50000, quantity: 2 },
//             "Vanilla Bliss": { price: 45000, quantity: 1 },
//             "Strawberry Shortcake": { price: 60000, quantity: 3 }
//         };
//         saveCart();
//         renderCart();
//         alert("Mock cakes added to your cart for testing!");
//     });
// }

const orderTypeInput = document.getElementById("order-type");
const addressInput = document.getElementById("delivery-address");

orderTypeInput.onchange = () => {
    if (orderTypeInput.value === "delivery") {
        addressInput.style.display = "block";
    } else {
        addressInput.style.display = "none";
    }
};

// Set minimum date/time to now for pickup/delivery date
const pickupDatetimeInput = document.getElementById("pickup-datetime");
if (pickupDatetimeInput) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Format as "YYYY-MM-DDTHH:MM"
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    pickupDatetimeInput.min = minDateTime;
}

const showSpinner = () => {
  document.getElementById("loading-spinner").style.display = "flex";
};
const hideSpinner = () => {
  document.getElementById("loading-spinner").style.display = "none";
};

const showToast = (message, isError = false) => {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.textContent = message;

  // Style for better visibility
  toast.style.background = isError ? "#e63946" : "#4caf50";
  toast.style.color = "white";
  toast.style.fontSize = "1rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.transition = "opacity 0.3s ease";
  toast.style.textAlign = "center";
  toast.style.padding = "0.5rem";
  toast.style.marginBottom = "0.3rem";
  toast.style.pointerEvents = "none"; // Ensures no interaction block

  toastContainer.appendChild(toast);

  // Animate fade out, but doesn’t block other interactions
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Initialize cart rendering on page load
loadCart();
renderCart();
loadCakesToShop();
