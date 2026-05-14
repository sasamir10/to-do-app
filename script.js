"use strict";

/* constants */
const CATS = ["work", "study", "health", "personal"];
const CAT_EMOJI = { work: "💼", study: "📚", health: "🏃", personal: "🏠" };
const PRI_LABEL = { low: "🟢 Low", medium: "🟡 Med", high: "🔴 High" };

/* state */
let tasks = [];
let filter = "all"; // 'all' | 'active' | 'completed' | cat name
let searchQ = "";
let viewMode = "grid"; // 'grid' | 'list'
let newTaskCat = "work";
let newTaskPri = "medium";

/* Every DOM reference */
const $ = (id) => document.getElementById(id);

const taskGrid = $("taskGrid");
const emptyState = $("emptyState");
const taskCounter = $("taskCounter");
const viewTitle = $("viewTitle");

const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");
const hamburger = $("hamburger");

const fabBtn = $("fabBtn");
const mobileFab = $("mobileFab");
const modalOverlay = $("modalOverlay");
const modalClose = $("modalClose");
const taskInput = $("taskInput");
const addTaskBtn = $("addTaskBtn");
const charCount = $("charCount");
const emptyAddBtn = $("emptyAddBtn");

const searchInput = $("searchInput");
const themeBtn = $("themeBtn");
const clearCompletedBtn = $("clearCompletedBtn");
const btnGrid = $("btnGrid");
const btnList = $("btnList");
const searchWrap = searchInput?.closest(".search-wrap");

/* Persistence */
function saveTasks() {
    localStorage.setItem("taskly_v2_tasks", JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const raw = localStorage.getItem("taskly_v2_tasks");
        tasks = raw ? JSON.parse(raw) : seedTasks();
    } catch {
        tasks = seedTasks();
    }
}

/* default seed data */
function seedTasks() {
    return [
        {
            id: uid(),
            text: "Daily standup with team",
            cat: "work",
            pri: "high",
            completed: false,
        },
        {
            id: uid(),
            text: "Review Q3 project proposal",
            cat: "work",
            pri: "medium",
            completed: false,
        },
        {
            id: uid(),
            text: "Reply to client emails",
            cat: "work",
            pri: "low",
            completed: true,
        },
        {
            id: uid(),
            text: "Read Chapter 5 – Algorithms",
            cat: "study",
            pri: "medium",
            completed: false,
        },
        {
            id: uid(),
            text: "Watch CSS Grid tutorial",
            cat: "study",
            pri: "low",
            completed: false,
        },
        {
            id: uid(),
            text: "Finish JavaScript assignment",
            cat: "study",
            pri: "high",
            completed: true,
        },
        {
            id: uid(),
            text: "Morning run – 5 km",
            cat: "health",
            pri: "medium",
            completed: true,
        },
        {
            id: uid(),
            text: "Evening meditation",
            cat: "health",
            pri: "low",
            completed: false,
        },
        {
            id: uid(),
            text: "Pay electricity bill",
            cat: "personal",
            pri: "high",
            completed: false,
        },
        {
            id: uid(),
            text: "Lunch with Emma",
            cat: "personal",
            pri: "low",
            completed: false,
        },
        {
            id: uid(),
            text: "Buy groceries",
            cat: "personal",
            pri: "medium",
            completed: true,
        },
    ];
}

/* theme */
function loadTheme() {
    const t = localStorage.getItem("taskly_theme") || "light";
    applyTheme(t);
}

function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const sunIcon = themeBtn.querySelector(".sun-icon");
    const moonIcon = themeBtn.querySelector(".moon-icon");
    const themeLabel = themeBtn.querySelector(".theme-label");
    sunIcon.style.display = t === "dark" ? "block" : "none";
    moonIcon.style.display = t === "light" ? "block" : "none";
    themeLabel.textContent = t === "light" ? "Dark Mode" : "Light Mode";
    localStorage.setItem("taskly_theme", t);
}

themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "light" ? "dark" : "light");
});

/* date */
function setDate() {
    const el = $("todayDate");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

function initLogoTypewriter() {
    const logoEl = $("logoTypeText");
    if (!logoEl) return;

    const text = "Taskly";
    let i = 0;
    let isDeleting = false;

    function tick() {
        logoEl.textContent = text.substring(0, i);

        if (!isDeleting) {
            i++;
            if (i > text.length) {
                isDeleting = true;
                setTimeout(tick, 800);
                return;
            }
        } else {
            i--;
            if (i === 0) isDeleting = false;
        }

        setTimeout(tick, isDeleting ? 80 : 150);
    }

    tick();
}

/* helpers */
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function esc(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function showToast(msg) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
}

/* filtering */
function getVisible() {
    return tasks.filter((task) => {
        // Status filter
        if (filter === "active" && task.completed) return false;
        if (filter === "completed" && !task.completed) return false;
        // Category filter (sidebar cat-nav)
        if (CATS.includes(filter) && task.cat !== filter) return false;
        // Search
        if (searchQ && !task.text.toLowerCase().includes(searchQ.toLowerCase()))
            return false;
        return true;
    });
}

/* render */
function render() {
    const visible = getVisible();

    // Set grid mode class
    taskGrid.className =
        "task-grid" + (viewMode === "list" ? " list-mode" : "");

    // Clear and repopulate
    taskGrid.innerHTML = "";
    visible.forEach((task, i) => {
        const card = buildCard(task, i);
        taskGrid.appendChild(card);
    });

    // Empty state
    emptyState.style.display = visible.length === 0 ? "block" : "none";

    // Counter
    const activeCount = tasks.filter((t) => !t.completed).length;
    taskCounter.textContent = `${tasks.length} total · ${activeCount} left`;

    // View title
    const titles = {
        all: "All Tasks",
        active: "Active",
        completed: "Completed",
        work: "Work",
        study: "Study",
        health: "Health",
        personal: "Personal",
    };
    viewTitle.textContent = titles[filter] || "Tasks";

    // Update sidebar badges
    updateBadges();
    updateStats();
}

/* build a single task card element */
function buildCard(task, idx) {
    const card = document.createElement("div");
    card.className = "task-card" + (task.completed ? " completed" : "");
    card.setAttribute("data-id", task.id);
    card.setAttribute("data-cat", task.cat);
    card.style.animationDelay = `${Math.min(idx * 0.03, 0.3)}s`;

    card.innerHTML = `
    <div class="card-header">
      <button class="task-check" aria-label="Toggle complete">
        <svg class="check-icon" width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5l3 3L10 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="card-actions">
        <button class="card-del-btn" aria-label="Delete task">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="card-body">
      <span class="task-text">${esc(task.text)}</span>
    </div>
    <div class="card-footer">
      <span class="cat-badge">${CAT_EMOJI[task.cat]} ${task.cat}</span>
      <span class="pri-badge">${PRI_LABEL[task.pri] || ""}</span>
    </div>
  `;

    card.querySelector(".task-check").addEventListener("click", () =>
        toggleTask(task.id),
    );
    card.querySelector(".card-del-btn").addEventListener("click", () =>
        deleteTask(task.id, card),
    );

    return card;
}

/* badge/stat updates */
function updateBadges() {
    const active = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;

    $("navAllCount").textContent = tasks.length;
    $("navActiveCount").textContent = active;
    $("navDoneCount").textContent = completed;

    CATS.forEach((cat) => {
        const el = $(`nav${cap(cat)}Count`);
        if (el) el.textContent = tasks.filter((t) => t.cat === cat).length;
    });
}

function updateStats() {
    CATS.forEach((cat) => {
        const all = tasks.filter((t) => t.cat === cat);
        const done = all.filter((t) => t.completed);
        const pct = all.length
            ? Math.round((done.length / all.length) * 100)
            : 0;

        const numEl = $(`stat${cap(cat)}`);
        const barEl = $(`bar${cap(cat)}`);
        const pctEl = $(`pct${cap(cat)}`);

        if (numEl) numEl.innerHTML = `${all.length} <small>tasks</small>`;
        if (barEl) barEl.style.width = pct + "%";
        if (pctEl) pctEl.textContent = pct + "%";
    });
}

function cap(str) {
    return str[0].toUpperCase() + str.slice(1);
}

/* task actions */
function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    render();
}

function deleteTask(id, el) {
    el.classList.add("removing");
    el.addEventListener(
        "animationend",
        () => {
            tasks = tasks.filter((t) => t.id !== id);
            saveTasks();
            render();
        },
        { once: true },
    );
}

function addTask(text, cat, pri) {
    if (!text.trim()) return false;
    tasks.unshift({ id: uid(), text: text.trim(), cat, pri, completed: false });
    saveTasks();
    render();
    showToast("Task added ✓");
    return true;
}

function clearCompleted() {
    const n = tasks.filter((t) => t.completed).length;
    if (!n) {
        showToast("No completed tasks");
        return;
    }
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    render();
    showToast(`${n} task${n > 1 ? "s" : ""} cleared`);
}

/* modal */
function openModal() {
    modalOverlay.classList.add("open");
    taskInput.value = "";
    charCount.textContent = "0";
    taskInput.focus();
}
function closeModal() {
    modalOverlay.classList.remove("open");
}

function submitTask() {
    const text = taskInput.value.trim();
    if (!text) {
        taskInput.style.borderColor = "#ef4444";
        taskInput.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.15)";
        taskInput.focus();
        setTimeout(() => {
            taskInput.style.borderColor = "";
            taskInput.style.boxShadow = "";
        }, 1200);
        return;
    }
    addTask(text, newTaskCat, newTaskPri);
    closeModal();
}

fabBtn.addEventListener("click", openModal);
mobileFab.addEventListener("click", openModal);
emptyAddBtn.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
});
addTaskBtn.addEventListener("click", submitTask);
taskInput.addEventListener("input", () => {
    charCount.textContent = taskInput.value.length;
});
taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTask();
});

// Category selection in modal
document.querySelectorAll(".cat-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".cat-opt")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        newTaskCat = btn.dataset.cat;
    });
});

// Priority selection in modal
document.querySelectorAll(".pri-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".pri-opt")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        newTaskPri = btn.dataset.pri;
    });
});

/* sidebar navigation */
// Status filter buttons
document.querySelectorAll(".nav-item[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
        setActiveNav(btn);
        filter = btn.dataset.filter;
        render();
        // Close sidebar on mobile
        if (window.innerWidth < 768) closeSidebar();
    });
});

// Category filter buttons
document.querySelectorAll(".nav-item.cat-nav").forEach((btn) => {
    btn.addEventListener("click", () => {
        // Toggle: clicking same cat again resets to 'all'
        if (filter === btn.dataset.cat) {
            filter = "all";
            setActiveNav(
                document.querySelector('.nav-item[data-filter="all"]'),
            );
        } else {
            setActiveNav(btn);
            filter = btn.dataset.cat;
        }
        render();
        if (window.innerWidth < 768) closeSidebar();
    });
});

function setActiveNav(el) {
    document
        .querySelectorAll(".nav-item")
        .forEach((b) => b.classList.remove("active"));
    el.classList.add("active");
}

/* mobile sidebar */
function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
}
function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}
hamburger.addEventListener("click", () =>
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar(),
);
sidebarOverlay.addEventListener("click", closeSidebar);

/* search */
function syncSearchHintState() {
    if (!searchWrap || !searchInput) return;
    searchWrap.classList.toggle(
        "has-value",
        searchInput.value.trim().length > 0,
    );
}

searchInput.addEventListener("input", () => {
    searchQ = searchInput.value;
    syncSearchHintState();
    render();
});
syncSearchHintState();

/* view toggle */
btnGrid.addEventListener("click", () => {
    viewMode = "grid";
    btnGrid.classList.add("active");
    btnList.classList.remove("active");
    render();
});

btnList.addEventListener("click", () => {
    viewMode = "list";
    btnList.classList.add("active");
    btnGrid.classList.remove("active");
    render();
});

/* clear completed */
clearCompletedBtn.addEventListener("click", clearCompleted);

/* keyboard shortcuts */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (modalOverlay.classList.contains("open")) closeModal();
        else closeSidebar();
    }
    // 'n' to open modal when not typing
    if (
        e.key === "n" &&
        !modalOverlay.classList.contains("open") &&
        document.activeElement.tagName !== "INPUT"
    ) {
        openModal();
    }
});

/* init */
loadTasks();
loadTheme();
setDate();
initLogoTypewriter();
render();
