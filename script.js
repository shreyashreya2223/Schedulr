// ================= API =================
const API_URL = "http://localhost:5000/reminders";

// ================= ELEMENTS =================
const form = document.getElementById("reminderForm");
const container = document.getElementById("reminderContainer");
const darkToggle = document.getElementById("darkToggle");
const searchInput = document.getElementById("searchInput");

const title = document.getElementById("title");
const description = document.getElementById("description");
const date = document.getElementById("date");
const time = document.getElementById("time");
const type = document.getElementById("type");
const priority = document.getElementById("priority");

// ================= STATE =================
let reminders = [];
let currentFilter = "all";
let editId = null;

// ================= NOTIFICATIONS =================
if ("Notification" in window) {
    Notification.requestPermission();
}

// ================= FETCH =================
async function loadReminders() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        reminders = data.map(r => ({ ...r, notified: false }));

        applyFilter(currentFilter);
    } catch (err) {
        console.log("Fetch error:", err);
    }
}

// ================= STATS =================
function updateStats() {
    document.getElementById("total").textContent =
        "Total: " + reminders.length;

    document.getElementById("completed").textContent =
        "Completed: " + reminders.filter(r => r.completed).length;

    document.getElementById("pending").textContent =
        "Pending: " + reminders.filter(r => !r.completed).length;
}

// ================= RENDER =================
function renderReminders(list) {
    container.innerHTML = "";
    updateStats();

    if (!list || list.length === 0) {
        container.innerHTML = "<p>No reminders yet ✨</p>";
        return;
    }

    list.forEach(reminder => {
        const card = document.createElement("div");

        const priorityClass = (reminder.priority || "low").toLowerCase();

        card.className = `reminder-card ${priorityClass}`;
        if (reminder.completed) card.classList.add("completed");

        card.innerHTML = `
            <div class="card-header">
                <h4>${reminder.title || "Untitled"}</h4>
                ${reminder.completed ? `<span class="completed-badge">Done</span>` : ""}
            </div>

            <p>${reminder.description || ""}</p>
            <small>${reminder.type} | ${reminder.date} at ${reminder.time}</small>

            <div class="action-buttons">
                <button class="complete-btn" onclick="toggleComplete('${reminder._id}')">
                    ${reminder.completed ? "Undo" : "Complete"}
                </button>

                <button class="edit-btn" onclick="startEdit('${reminder._id}')">
                    Edit
                </button>

                <button class="delete-btn" onclick="deleteReminder('${reminder._id}')">
                    Delete
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ================= FILTER =================
function applyFilter(type) {
    currentFilter = type;

    const today = new Date().toISOString().split("T")[0];
    let filtered = [];

    if (type === "today") {
        filtered = reminders.filter(r => r.date === today);
    } 
    else if (type === "high") {
        filtered = reminders.filter(r => r.priority === "High");
    } 
    else if (type === "completed") {
        filtered = reminders.filter(r => r.completed);
    } 
    else {
        filtered = [...reminders];
    }

    renderReminders(filtered);
}

function filterReminders(type) {
    applyFilter(type);
}

// ================= SEARCH =================
searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = reminders.filter(r =>
        (r.title || "").toLowerCase().includes(value) ||
        (r.description || "").toLowerCase().includes(value)
    );

    renderReminders(filtered);
});

// ================= NOTIFICATION =================
function showNotification(reminder) {
    if (Notification.permission === "granted") {
        new Notification("⏰ Reminder", {
            body: `${reminder.title} at ${reminder.time}`
        });
    }
}

// ================= CHECK =================
setInterval(() => {
    const now = new Date();

    reminders.forEach(reminder => {
        if (!reminder.completed) {
            const reminderTime = new Date(reminder.date + " " + reminder.time);
            const diff = reminderTime - now;

            if (!reminder.notified && diff > 0 && diff < 60000) {
                showNotification(reminder);
                reminder.notified = true;
            }
        }
    });
}, 15000);

// ================= EDIT =================
function startEdit(id) {
    const reminder = reminders.find(r => r._id === id);

    title.value = reminder.title || "";
    description.value = reminder.description || "";
    date.value = reminder.date;
    time.value = reminder.time;
    type.value = reminder.type;
    priority.value = reminder.priority;

    editId = id;
}

// ================= SAVE =================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        title: title.value,
        description: description.value,
        date: date.value,
        time: time.value,
        type: type.value,
        priority: priority.value,
        completed: false
    };

    if (editId) {
        await fetch(`${API_URL}/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        editId = null;
    } else {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    }

    form.reset();
    loadReminders();
});

// ================= COMPLETE =================
async function toggleComplete(id) {
    const reminder = reminders.find(r => r._id === id);

    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...reminder,
            completed: !reminder.completed
        })
    });

    loadReminders();
}

// ================= DELETE =================
async function deleteReminder(id) {
    if (!confirm("Delete this reminder?")) return;

    await fetch(`${API_URL}/${id}`, { method: "DELETE" });

    loadReminders();
}

// ================= DARK MODE =================
darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ================= INIT =================
loadReminders();