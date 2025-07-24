// ذخیره و بارگذاری تودوها
const saveTodos = (todos) => localStorage.setItem("todos", JSON.stringify(todos));
const getTodos = () => {
  try { return JSON.parse(localStorage.getItem("todos")) || []; }
  catch { return []; }
};

// ذخیره و بارگذاری تم
const saveTheme = (theme) => localStorage.setItem("theme", theme);
const getTheme = () => localStorage.getItem("theme") || "light";

// فرمت زمان (mm:ss)
const formatTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

document.addEventListener("DOMContentLoaded", () => {
  // المنت‌ها
  const loader = document.getElementById("loader");
  const app = document.getElementById("app");
  const form = document.getElementById("todoForm");
  const inputTitle = document.getElementById("title");
  const todoListEl = document.getElementById("todoList");
  const remainingTodosEl = document.getElementById("remainingTodos");
  const themeSelect = document.getElementById("themeSwitcher");
  const sortSelect = document.getElementById("sort");
  const filterSelect = document.getElementById("filterSelect");
  const exportJsonBtn = document.getElementById("exportJson");
  const exportCsvBtn = document.getElementById("exportCsv");
  const searchInput = document.getElementById("search");
  const inputColor = document.getElementById("color");
  const exportPdfBtn = document.getElementById("exportPdf");
  const backupBtn = document.getElementById("backupBtn");
  const restoreBtn = document.getElementById("restoreBtn");
  const restoreInput = document.getElementById("restoreInput");

  const timers = new Map();
  let todos = getTodos();
  let theme = getTheme();

  // اعمال تم
  document.body.classList.add(theme);
  themeSelect.value = theme;

  // مخفی کردن لودر و نمایش اپ
  loader.style.display = "none";
  app.classList.remove("hidden");

  // پیام خطا (toast)
  const showError = (msg) => {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // اضافه کردن تودو
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = inputTitle.value.trim();
    if (title.length === 0) return showError("Task cannot be empty.");
    if (title.length > 100) return showError("Task is too long.");
    todos.push({
      id: Date.now(),
      title,
      done: false,
      createdAt: Date.now(),
    });
    saveTodos(todos);
    renderTodos();
    form.reset();
  });

  // رندر تودوها
  const renderTodos = () => {
    todoListEl.innerHTML = "";
    if (todos.length === 0) {
      todoListEl.innerHTML = "<p>No tasks yet.</p>";
      remainingTodosEl.textContent = "";
      return;
    }
    let remaining = 0;
    todos.forEach(todo => {
      const div = document.createElement("div");
      div.className = "todo-item" + (todo.done ? " done" : "");
      div.dataset.id = todo.id;
      // Custom checkbox
      const checkbox = document.createElement("span");
      checkbox.className = "custom-checkbox" + (todo.done ? " checked" : "");
      checkbox.innerHTML = todo.done ? `<svg width='16' height='16' viewBox='0 0 16 16'><polyline points='3,8 7,12 13,4' style='fill:none;stroke:white;stroke-width:2'/></svg>` : "";
      checkbox.onclick = () => {
        todo.done = !todo.done;
        saveTodos(todos);
        renderTodos();
      };
      div.appendChild(checkbox);
      // Title
      const titleEl = document.createElement("div");
      titleEl.className = "todo-title";
      titleEl.textContent = todo.title;
      div.appendChild(titleEl);
      // Delete button
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = "&#10005;";
      delBtn.onclick = () => {
        todos = todos.filter(t => t.id !== todo.id);
        saveTodos(todos);
        renderTodos();
      };
      div.appendChild(delBtn);
      todoListEl.appendChild(div);
      if (!todo.done) remaining++;
    });
    remainingTodosEl.textContent = `Your remaining todos: ${remaining}`;
  };

  // Populate category filter
  function updateCategoryFilter() {
    if (!categoryFilter) return;
    const cats = Array.from(new Set(todos.map(t => t.category)));
    categoryFilter.innerHTML = '<option value="all">دسته‌بندی: همه</option>' +
      cats.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  }
  if (categoryFilter) categoryFilter.addEventListener("change", renderTodos);

  themeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    document.body.classList.remove("light", "dark");
    document.body.classList.add(val);
    saveTheme(val);
  });

  if (sortSelect) sortSelect.addEventListener("change", renderTodos);
  if (filterSelect) filterSelect.addEventListener("change", renderTodos);
  if (searchInput) searchInput.addEventListener("input", renderTodos);
  if (inputColor) inputColor.addEventListener("input", renderTodos); // Add listener for color input

  exportJsonBtn.onclick = () => {
    const data = JSON.stringify(todos, null, 2);
    downloadFile("todos.json", data, "application/json");
  };

  exportCsvBtn.onclick = () => {
    const header = ["id", "title", "description", "category", "difficulty", "done", "timerRemaining", "createdAt"];
    const rows = todos.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.difficulty,
      t.done,
      t.timerRemaining,
      t.createdAt,
    ].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    downloadFile("todos.csv", csv, "text/csv");
  };

  // خروجی PDF
  exportPdfBtn.onclick = () => {
    import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js').then(({jsPDF}) => {
      const doc = new jsPDF();
      doc.setFont("Vazirmatn");
      todos.forEach((t, i) => {
        doc.text(`${i+1}. ${t.title} [${t.category}] - ${t.done ? '✔️' : '❌'}`, 10, 20 + i*15);
      });
      doc.save("todos.pdf");
    });
  };
  // بکاپ
  backupBtn.onclick = () => {
    const data = JSON.stringify(todos, null, 2);
    downloadFile("todos-backup.json", data, "application/json");
  };
  // بازیابی
  restoreBtn.onclick = () => {
    restoreInput.click();
  };
  restoreInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (Array.isArray(arr)) {
          todos = arr;
          saveTodos(todos);
          saveAndRender();
          showError("بازیابی با موفقیت انجام شد.");
        } else {
          showError("فرمت فایل صحیح نیست.");
        }
      } catch {
        showError("خطا در خواندن فایل.");
      }
    };
    reader.readAsText(file);
  };

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // After saving todos or on render, update category filter
  function saveAndRender() {
    saveTodos(todos);
    updateCategoryFilter();
    renderTodos();
  }

  // Initial load
  updateCategoryFilter();
  renderTodos();
});
