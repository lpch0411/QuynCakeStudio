const cakeForm = document.getElementById("cake-form");
const tableBody = document.querySelector("#cake-table tbody");

const showAdminMessage = (msg, isError = false) => {
    let msgEl = document.getElementById("admin-msg");
    if (!msgEl) {
        msgEl = document.createElement("div");
        msgEl.id = "admin-msg";
        msgEl.style.textAlign = "center";
        msgEl.style.margin = "12px 0";
        msgEl.style.color = isError ? "red" : "green";
        cakeForm.parentElement.insertBefore(msgEl, cakeForm.nextSibling);
    }
    msgEl.style.color = isError ? "red" : "green";
    msgEl.textContent = msg;
    setTimeout(() => { msgEl.textContent = ""; }, 3500);
};

const loadCakes = async () => {
    tableBody.innerHTML = "<tr><td colspan='9'>Loading...</td></tr>";
    try {
        const res = await fetch("/api/cakes/all");
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const cakes = await res.json();
        tableBody.innerHTML = "";
        cakes.forEach(cake => {
            const row = document.createElement("tr");
            row.innerHTML = `
  <td>${cake.image ? `<img src="${cake.image}" class="preview">` : '—'}</td>
  <td><input value="${cake.name}" /></td>
  <td><input value="${cake.description || ''}" /></td>
  <td><input type="number" value="${cake.price}" /></td>
  <td><input value="${cake.category || ''}" /></td>
  <td>${cake.available == 1 ? "Available" : "Unavailable"}</td>
  <td>${new Date(cake.created_at).toLocaleString('vi-VN')}</td>
  <td>${new Date(cake.updated_at).toLocaleString('vi-VN')}</td>
  <td>
    <button onclick="updateCake(${cake.id}, this)">Save</button>
    <button onclick="toggleCake(${cake.id}, ${cake.available == 1})">
      ${cake.available == 1 ? "Disable" : "Enable"}
    </button>
    <button onclick="deleteCake(${cake.id})" style="color:red;">Delete</button>
  </td>
`;
            tableBody.appendChild(row);
        });
        if (!cakes.length) {
            tableBody.innerHTML = "<tr><td colspan='9' style='color:#777'>No cakes found.</td></tr>";
        }
    } catch (err) {
        console.error("Failed to load cakes:", err);
        tableBody.innerHTML = "<tr><td colspan='9' style='color:red'>Error loading cakes. Try again later.</td></tr>";
    }
};

const deleteCake = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this cake?")) return;
    try {
        const res = await fetch(`/api/cakes/${id}`, { method: "DELETE" });
        if (!res.ok) {
            throw new Error(`Failed to delete (status: ${res.status})`);
        }
        showAdminMessage("Cake deleted.");
        loadCakes();
    } catch (err) {
        showAdminMessage("Error deleting cake: " + err.message, true);
        console.error(err);
    }
};

const updateCake = async (id, button) => {
    const row = button.closest("tr");
    const [nameInput, descInput, priceInput, categoryInput] = row.querySelectorAll("input");
    try {
        const res = await fetch(`/api/cakes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nameInput.value,
                description: descInput.value,
                price: parseFloat(priceInput.value),
                category: categoryInput.value,
                available: 1
            })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed to update (status: ${res.status})`);
        }
        showAdminMessage("Cake updated.");
        loadCakes();
    } catch (err) {
        showAdminMessage("Error updating cake: " + err.message, true);
        console.error(err);
    }
};

const toggleCake = async (id, isCurrentlyAvailable) => {
    try {
        const res = await fetch(`/api/cakes/${id}/available`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ available: isCurrentlyAvailable ? 0 : 1 })
        });
        if (!res.ok) {
            throw new Error(`Failed to toggle (status: ${res.status})`);
        }
        showAdminMessage("Cake status changed.");
        loadCakes();
    } catch (err) {
        showAdminMessage("Error changing status: " + err.message, true);
        console.error(err);
    }
};

cakeForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("category", document.getElementById("category").value);
    const imageFile = document.getElementById("image").files[0];
    if (imageFile) formData.append("image", imageFile);

    try {
        const res = await fetch("/api/cakes", {
            method: "POST",
            body: formData
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Upload failed (status: ${res.status})`);
        }
        showAdminMessage("Cake added!");
        cakeForm.reset();
        loadCakes();
    } catch (err) {
        showAdminMessage("Error adding cake: " + err.message, true);
        console.error(err);
    }
});

loadCakes();
