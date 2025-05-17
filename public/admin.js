const cakeForm = document.getElementById("cake-form");
const tableBody = document.querySelector("#cake-table tbody");

const loadCakes = async () => {
    const res = await fetch("/api/cakes/all");
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
  <td>${new Date(cake.created_at).toLocaleString('vi-VN')}</td>
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
};

const deleteCake = async (id) => {
    const confirmDelete = confirm("Are you sure you want to permanently delete this cake?");
    if (!confirmDelete) return;

    await fetch(`/api/cakes/${id}`, {
        method: "DELETE"
    });

    loadCakes();
};

const updateCake = async (id, button) => {
    const row = button.closest("tr");
    const [nameInput, descInput, priceInput, categoryInput] = row.querySelectorAll("input");
    await fetch(`/api/cakes/${id}`, {
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
    loadCakes();
};

const toggleCake = async (id, isCurrentlyAvailable) => {
    await fetch(`/api/cakes/${id}/available`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: isCurrentlyAvailable ? 0 : 1 })
    });
    loadCakes();
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

    await fetch("/api/cakes", {
        method: "POST",
        body: formData
    });

    cakeForm.reset();
    loadCakes();
});

loadCakes();