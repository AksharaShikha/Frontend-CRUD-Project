
/* =========================================
   1. API URL AND DOM ELEMENTS
========================================= */

const API_URL = "https://jsonplaceholder.typicode.com/users";

const userForm = document.getElementById("user-form");
const userIdInput = document.getElementById("user-id");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const usersList = document.getElementById("users-list");
const statusMessage = document.getElementById("status-message");
const searchInput = document.getElementById("search-input");
const userCount = document.getElementById("user-count");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

/* =========================================
   2. STORE USERS
========================================= */

let allUsers = [];

/* =========================================
   3. GET - FETCH USERS FROM API
========================================= */

async function fetchUsers() {
    statusMessage.textContent = "Loading users...";
    usersList.innerHTML = "";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch users.");
        }

        allUsers = await response.json();

        renderUsers();

        statusMessage.textContent = allUsers.length
            ? "Users loaded successfully."
            : "No users found.";

    } catch (error) {
        console.error("Fetch error:", error);

        allUsers = [];
        usersList.innerHTML = "";
        userCount.textContent = "0 users";

        statusMessage.textContent =
            "Unable to load users. Check your internet connection.";
    }
}

/* =========================================
   4. SEARCH AND RENDER USERS
========================================= */

function renderUsers() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredUsers = allUsers.filter((user) => {
        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();

        return (
            name.includes(searchTerm) ||
            email.includes(searchTerm)
        );
    });

    usersList.innerHTML = "";

    filteredUsers.forEach((user) => {
        displayUser(user);
    });

    userCount.textContent =
        `${filteredUsers.length} of ${allUsers.length} users`;

    if (filteredUsers.length === 0) {
        statusMessage.textContent = searchTerm
            ? "No users match your search."
            : "No users available.";
    } else if (searchTerm) {
        statusMessage.textContent =
            `Found ${filteredUsers.length} matching users.`;
    } else {
        statusMessage.textContent =
            `Showing ${allUsers.length} users.`;
    }
}

// Search by name or email
searchInput.addEventListener("input", renderUsers);

/* =========================================
   5. DISPLAY A USER IN THE TABLE
========================================= */

function displayUser(user) {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = user.id;

    const nameCell = document.createElement("td");
    nameCell.textContent = user.name;

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email;

    const actionsCell = document.createElement("td");

    // Edit button
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.className = "edit-btn";

    editButton.addEventListener("click", () => {
        editUser(user);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", () => {
        deleteUser(user.id);
    });

    actionsCell.append(editButton, deleteButton);
    row.append(idCell, nameCell, emailCell, actionsCell);

    usersList.appendChild(row);
}

/* =========================================
   6. POST - ADD USER / PUT - UPDATE USER
========================================= */

userForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userId = userIdInput.value;
    const isEditing = userId !== "";

    const userData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim()
    };

    if (!userData.name || !userData.email) {
        statusMessage.textContent =
            "Please fill in all fields.";
        return;
    }

    const url = isEditing
        ? `${API_URL}/${userId}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    submitBtn.disabled = true;

    const originalButtonText = submitBtn.textContent;

    submitBtn.textContent = isEditing
        ? "Updating..."
        : "Adding...";

    statusMessage.textContent = isEditing
        ? "Updating user..."
        : "Adding user...";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error("Unable to save user.");
        }

        const savedUser = await response.json();

        if (isEditing) {
            // Update the user in the local list
            allUsers = allUsers.map((user) => {
                if (String(user.id) === String(userId)) {
                    return {
                        ...user,
                        name: savedUser.name ?? userData.name,
                        email: savedUser.email ?? userData.email
                    };
                }

                return user;
            });

            statusMessage.textContent =
                "User updated successfully!";

        } else {
            // Add the new user to the local list
            const newUser = {
                id: savedUser.id ?? `new-${Date.now()}`,
                name: savedUser.name ?? userData.name,
                email: savedUser.email ?? userData.email
            };

            allUsers.unshift(newUser);

            statusMessage.textContent =
                "User added successfully!";
        }

        resetForm();
        renderUsers();

    } catch (error) {
        console.error("Save error:", error);

        statusMessage.textContent =
            "Unable to save user. Please try again.";

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalButtonText;
    }
});

/* =========================================
   7. EDIT USER
========================================= */

function editUser(user) {
    userIdInput.value = user.id;
    nameInput.value = user.name;
    emailInput.value = user.email;

    formTitle.textContent = "Edit User";
    submitBtn.textContent = "Update User";
    cancelBtn.hidden = false;

    statusMessage.textContent =
        `Editing ${user.name}`;

    nameInput.focus();
}

/* =========================================
   8. DELETE USER
========================================= */

async function deleteUser(userId) {
    const user = allUsers.find(
        (item) => String(item.id) === String(userId)
    );

    if (!user) {
        statusMessage.textContent = "User not found.";
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
        return;
    }

    statusMessage.textContent = "Deleting user...";

    try {
        const response = await fetch(
            `${API_URL}/${userId}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Unable to delete user.");
        }

        // Remove from local list after successful response
        allUsers = allUsers.filter(
            (item) => String(item.id) !== String(userId)
        );

        // Reset the form if the deleted user was being edited
        if (String(userIdInput.value) === String(userId)) {
            resetForm();
        }

        renderUsers();
        statusMessage.textContent =
            "User deleted successfully!";

    } catch (error) {
        console.error("Delete error:", error);

        statusMessage.textContent =
            "Unable to delete user. Please try again.";
    }
}

/* =========================================
   9. RESET FORM
========================================= */

function resetForm() {
    userForm.reset();

    userIdInput.value = "";
    formTitle.textContent = "Add New User";
    submitBtn.textContent = "Add User";
    cancelBtn.hidden = true;
}

// Cancel editing
cancelBtn.addEventListener("click", () => {
    resetForm();
    statusMessage.textContent = "Editing cancelled.";
});

/* =========================================
   10. START APPLICATION
========================================= */

fetchUsers();
