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
  <td>${cake.available == 1 ? "Đang bán" : "Ngừng bán"}</td>
  <td>${new Date(cake.created_at).toLocaleString('vi-VN')}</td>
  <td>${new Date(cake.updated_at).toLocaleString('vi-VN')}</td>
  <td>
    <button onclick="updateCake(${cake.id}, this)">Lưu</button>
    <button onclick="toggleCake(${cake.id}, ${cake.available == 1})">
      ${cake.available == 1 ? "Vô hiệu" : "Kích hoạt"}
    </button>
    <button onclick="deleteCake(${cake.id})" style="color:red;">Xóa</button>
  </td>
`;
            tableBody.appendChild(row);
        });
        if (!cakes.length) {
            tableBody.innerHTML = "<tr><td colspan='9' style='color:#777'>Không tìm thấy bánh nào.</td></tr>";
        }
    } catch (err) {
        console.error("Failed to load cakes:", err);
        tableBody.innerHTML = "<tr><td colspan='9' style='color:red'>Lỗi tải bánh. Vui lòng thử lại sau.</td></tr>";
    }
};

const deleteCake = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa vĩnh viễn bánh này?")) return;
    try {
        const res = await fetch(`/api/cakes/${id}`, { method: "DELETE" });
        if (!res.ok) {
            throw new Error(`Failed to delete (status: ${res.status})`);
        }
        showAdminMessage("Đã xóa bánh.");
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
        showAdminMessage("Đã cập nhật bánh.");
        loadCakes();
    } catch (err) {
        showAdminMessage("Lỗi cập nhật bánh: " + err.message, true);
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
        showAdminMessage("Đã thay đổi trạng thái bánh.");
        loadCakes();
    } catch (err) {
        showAdminMessage("Lỗi thay đổi trạng thái: " + err.message, true);
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
        showAdminMessage("Đã thêm bánh!");
        cakeForm.reset();
        loadCakes();
    } catch (err) {
        showAdminMessage("Lỗi thêm bánh: " + err.message, true);
        console.error(err);
    }
});

loadCakes();
