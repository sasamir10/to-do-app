/* =============================================
   Taskly – script.js
   ============================================= */

// ── State ─────────────────────────────────────
let tasks       = [];
let currentFilter  = 'all';
let currentCat     = 'business';
let searchQuery    = '';

// ── DOM Refs ──────────────────────────────────
const taskList        = document.getElementById('taskList');
const emptyState      = document.getElementById('emptyState');
const taskCounter     = document.getElementById('taskCounter');
const businessCount   = document.getElementById('businessCount');
const personalCount   = document.getElementById('personalCount');
const businessProgress= document.getElementById('businessProgress');
const personalProgress= document.getElementById('personalProgress');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const fabBtn       = document.getElementById('fabBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const taskInput    = document.getElementById('taskInput');
const addTaskBtn   = document.getElementById('addTaskBtn');
const charCount    = document.getElementById('charCount');

const searchBtn    = document.getElementById('searchBtn');
const searchBar    = document.getElementById('searchBar');
const searchInput  = document.getElementById('searchInput');
const clearSearch  = document.getElementById('clearSearch');

const themeBtn     = document.getElementById('themeBtn');
const sunIcon      = themeBtn.querySelector('.sun-icon');
const moonIcon     = themeBtn.querySelector('.moon-icon');

const filterTabs   = document.querySelectorAll('.tab');
const catBtns      = document.querySelectorAll('.cat-btn');

// ── Persistence ───────────────────────────────
function saveTasks() {
  localStorage.setItem('taskly_tasks', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const stored = localStorage.getItem('taskly_tasks');
    tasks = stored ? JSON.parse(stored) : defaultTasks();
  } catch {
    tasks = defaultTasks();
  }
}

/** Pre-loaded sample tasks mirroring the screenshot */
function defaultTasks() {
  return [
    { id: uid(), text: 'Daily meeting with team', completed: false, cat: 'business' },
    { id: uid(), text: 'Pay for rent',            completed: true,  cat: 'personal' },
    { id: uid(), text: 'Check emails',            completed: false, cat: 'business' },
    { id: uid(), text: 'Lunch with Emma',         completed: false, cat: 'personal' },
    { id: uid(), text: 'Meditation',              completed: false, cat: 'personal' },
  ];
}

// ── Theme ─────────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem('taskly_theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  sunIcon.style.display  = theme === 'light' ? 'block' : 'none';
  moonIcon.style.display = theme === 'dark'  ? 'block' : 'none';
  localStorage.setItem('taskly_theme', theme);
}

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// ── Helpers ───────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

// ── Filtered task list ────────────────────────
function getFilteredTasks() {
  return tasks.filter(task => {
    const matchesFilter =
      currentFilter === 'all'       ? true :
      currentFilter === 'active'    ? !task.completed :
      currentFilter === 'completed' ?  task.completed : true;

    const matchesSearch = !searchQuery ||
      task.text.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });
}

// ── Render ────────────────────────────────────
function render() {
  const filtered = getFilteredTasks();

  // Task items
  taskList.innerHTML = '';
  filtered.forEach((task, i) => {
    const li = document.createElement('div');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-cat', task.cat);
    li.style.animationDelay = `${i * 0.04}s`;

    li.innerHTML = `
      <button class="task-check" aria-label="Toggle ${task.text}">
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M1 5l4 4L12 1" stroke="var(--accent-blue)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <span class="task-cat-pill ${task.cat}">${task.cat === 'business' ? '💼' : '🏠'} ${task.cat}</span>
      <button class="task-delete" aria-label="Delete ${task.text}">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    // Events
    li.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
    li.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id, li));

    taskList.appendChild(li);
  });

  // Empty state
  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

  // Counter
  const active = tasks.filter(t => !t.completed).length;
  taskCounter.textContent = `${active} left`;

  // Category counts & progress bars
  updateCategories();
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateCategories() {
  const biz = tasks.filter(t => t.cat === 'business');
  const per = tasks.filter(t => t.cat === 'personal');
  const bizDone = biz.filter(t => t.completed).length;
  const perDone = per.filter(t => t.completed).length;

  businessCount.textContent = `${biz.length} task${biz.length !== 1 ? 's' : ''}`;
  personalCount.textContent = `${per.length} task${per.length !== 1 ? 's' : ''}`;

  businessProgress.style.width = biz.length ? `${(bizDone / biz.length) * 100}%` : '0%';
  personalProgress.style.width = per.length ? `${(perDone / per.length) * 100}%` : '0%';
}

// ── Task Actions ──────────────────────────────

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id, el) {
  el.classList.add('removing');
  el.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }, { once: true });
}

function addTask(text, cat) {
  if (!text.trim()) return;
  tasks.unshift({ id: uid(), text: text.trim(), completed: false, cat });
  saveTasks();
  render();
  showToast('Task added ✓');
}

function clearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) { showToast('No completed tasks'); return; }
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
  showToast(`${count} task${count !== 1 ? 's' : ''} cleared`);
}

// ── Modal ─────────────────────────────────────
function openModal() {
  modalOverlay.classList.add('open');
  taskInput.value = '';
  charCount.textContent = '0';
  taskInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

fabBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

taskInput.addEventListener('input', () => {
  charCount.textContent = taskInput.value.length;
});

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitNewTask();
});

addTaskBtn.addEventListener('click', submitNewTask);

function submitNewTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.style.borderColor = '#ef4444';
    taskInput.focus();
    setTimeout(() => taskInput.style.borderColor = '', 1000);
    return;
  }
  addTask(text, currentCat);
  closeModal();
}

// Category selection inside modal
catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    catBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = btn.dataset.cat;
  });
});

// ── Filter Tabs ───────────────────────────────
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

// ── Clear Completed ───────────────────────────
clearCompletedBtn.addEventListener('click', clearCompleted);

// ── Category card click (filter) ──────────────
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    // Toggle: if already filtering by this category, reset
    const cat = card.dataset.category;
    if (searchQuery && searchQuery.startsWith('cat:' + cat)) {
      searchQuery = '';
    } else {
      searchQuery = 'cat:' + cat;
    }
    render();
  });
});

// Override getFilteredTasks to handle 'cat:' prefix
const _getFiltered = getFilteredTasks;

// Patch: redefine to handle cat: filter from category card clicks
(function() {
  const orig = window.getFilteredTasks;
  window.getFilteredTasksOld = orig;
})();

// Full search: redefine render's use
function getVisibleTasks() {
  return tasks.filter(task => {
    const matchesFilter =
      currentFilter === 'all'       ? true :
      currentFilter === 'active'    ? !task.completed :
      currentFilter === 'completed' ?  task.completed : true;

    let matchesSearch = true;
    if (searchQuery.startsWith('cat:')) {
      matchesSearch = task.cat === searchQuery.replace('cat:', '');
    } else if (searchQuery) {
      matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return matchesFilter && matchesSearch;
  });
}

// Replace render's filtered call:
function render() {
  const filtered = getVisibleTasks();

  taskList.innerHTML = '';
  filtered.forEach((task, i) => {
    const li = document.createElement('div');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-cat', task.cat);
    li.style.animationDelay = `${i * 0.04}s`;

    li.innerHTML = `
      <button class="task-check" aria-label="Toggle">
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M1 5l4 4L12 1" stroke="var(--accent-blue)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <span class="task-cat-pill ${task.cat}">${task.cat === 'business' ? '💼' : '🏠'} ${task.cat}</span>
      <button class="task-delete" aria-label="Delete">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    li.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
    li.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id, li));

    taskList.appendChild(li);
  });

  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

  const active = tasks.filter(t => !t.completed).length;
  taskCounter.textContent = `${active} left`;

  updateCategories();
}

// ── Search ────────────────────────────────────
searchBtn.addEventListener('click', () => {
  searchBar.classList.toggle('visible');
  if (searchBar.classList.contains('visible')) {
    searchInput.focus();
  } else {
    searchQuery = '';
    searchInput.value = '';
    render();
  }
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  render();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  render();
  searchInput.focus();
});

// ── Keyboard shortcuts ────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalOverlay.classList.contains('open')) closeModal();
    if (searchBar.classList.contains('visible')) {
      searchBar.classList.remove('visible');
      searchQuery = '';
      render();
    }
  }
  // Press N to add new task (when modal not open & not typing)
  if (e.key === 'n' && !modalOverlay.classList.contains('open') && document.activeElement.tagName !== 'INPUT') {
    openModal();
  }
});

// ── Init ──────────────────────────────────────
loadTasks();
loadTheme();
render();
