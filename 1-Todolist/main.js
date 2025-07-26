let todos = [];
let categories = new Set();

let filter = {
  done: "all",
  difficulty: "all",
  category: "all",
  orderBy: "time-desc",
};

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}
function loadTodos() {
  const data = localStorage.getItem("todos");
  if (data) {
    todos = JSON.parse(data);
    todos.forEach((t) => {
      if (t.category) categories.add(t.category);
    });
    updateCategoryFilterOptions();
  }
}

function renderTodos() {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  let filtered = todos.slice();

  if (filter.done === "done") filtered = filtered.filter((t) => t.done);
  else if (filter.done === "notdone")
    filtered = filtered.filter((t) => !t.done);

  if (filter.difficulty !== "all")
    filtered = filtered.filter((t) => t.difficulty == filter.difficulty);
  if (filter.category !== "all")
    filtered = filtered.filter((t) => t.category === filter.category);

  switch (filter.orderBy) {
    case "time-desc":
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "time-asc":
      filtered.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "difficulty-desc":
      filtered.sort((a, b) => b.difficulty - a.difficulty);
      break;
    case "difficulty-asc":
      filtered.sort((a, b) => a.difficulty - b.difficulty);
      break;
  }

  if (filtered.length === 0) {
    list.innerHTML =
      '<li style="text-align:center; padding:1rem; color: var(--placeholder-color);">تودی یافت نشد.</li>';
    return;
  }

  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo";

    const header = document.createElement("div");
    header.className = "todo-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("div");
    text.className = "todo-text";
    if (todo.done) text.classList.add("done");
    text.textContent = todo.title;

    const btns = document.createElement("div");
    btns.className = "todo-buttons";

    const delBtn = document.createElement("button");
    delBtn.title = "حذف";
    delBtn.textContent = "🗑️";
    delBtn.onclick = () => {
      if (confirm("آیا از حذف این تودو مطمئن هستید؟")) {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos();
        renderTodos();
        updateCategoryFilterOptions();
      }
    };

    const editBtn = document.createElement("button");
    editBtn.title = "ویرایش";
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      const newTitle = prompt("عنوان جدید:", todo.title);
      if (newTitle === null) return;
      const newDesc = prompt("توضیحات جدید:", todo.description || "");
      if (newDesc === null) return;
      let newDifficulty = prompt("سختی جدید (1 تا 5):", todo.difficulty);
      if (newDifficulty === null) return;
      newDifficulty = parseInt(newDifficulty);
      if (isNaN(newDifficulty) || newDifficulty < 1 || newDifficulty > 5) {
        alert("میزان سختی باید بین 1 تا 5 باشد");
        return;
      }
      const newCategory = prompt("دسته‌بندی جدید:", todo.category || "");
      if (newCategory === null) return;

      todo.title = newTitle.trim() || todo.title;
      todo.description = newDesc.trim();
      todo.difficulty = newDifficulty;
      todo.category = newCategory.trim();

      categories.add(todo.category);
      saveTodos();
      renderTodos();
      updateCategoryFilterOptions();
    };

    btns.append(delBtn, editBtn);

    header.append(checkbox, text, btns);
    li.appendChild(header);

    if (todo.description) {
      const desc = document.createElement("div");
      desc.className = "todo-desc";
      desc.textContent = todo.description;
      li.appendChild(desc);
    }

    const diffDiv = document.createElement("div");
    diffDiv.className = "todo-info";
    diffDiv.textContent = "سختی: ";
    const stars = document.createElement("span");
    for (let i = 1; i <= 5; i++) {
      stars.textContent += i <= todo.difficulty ? "★" : "☆";
    }
    diffDiv.appendChild(stars);
    li.appendChild(diffDiv);

    if (todo.category) {
      const catDiv = document.createElement("div");
      catDiv.className = "todo-info";
      catDiv.textContent = "دسته: " + todo.category;
      li.appendChild(catDiv);
    }

    list.appendChild(li);
  });
}

document.getElementById("todo-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const title = e.target.title.value.trim();
  const description = e.target.description.value.trim();
  const difficulty = parseInt(e.target.difficulty.value);
  const category = e.target.category.value.trim();

  if (!title) {
    showError("عنوان نمی‌تواند خالی باشد");
    return;
  }
  if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
    showError("سختی باید بین 1 تا 5 باشد");
    return;
  }

  clearError();

  const newTodo = {
    id: Date.now().toString(),
    title,
    description,
    difficulty,
    category,
    done: false,
    createdAt: Date.now(),
  };

  todos.push(newTodo);
  if (category) categories.add(category);

  saveTodos();
  renderTodos();
  updateCategoryFilterOptions();

  e.target.reset();
});

function showError(msg) {
  const el = document.getElementById("error-message");
  el.textContent = msg;
}
function clearError() {
  const el = document.getElementById("error-message");
  el.textContent = "";
}

function updateCategoryFilterOptions() {
  const select = document.getElementById("filter-category");
  const current = select.value;
  select.innerHTML = '<option value="all">همه دسته‌ها</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  if ([...categories].includes(current)) {
    select.value = current;
    filter.category = current;
  } else {
    select.value = "all";
    filter.category = "all";
  }
}

document.getElementById("filter-done").addEventListener("change", (e) => {
  filter.done = e.target.value;
  renderTodos();
});
document.getElementById("filter-difficulty").addEventListener("change", (e) => {
  filter.difficulty = e.target.value;
  renderTodos();
});
document.getElementById("filter-category").addEventListener("change", (e) => {
  filter.category = e.target.value;
  renderTodos();
});
document.getElementById("filter-order").addEventListener("change", (e) => {
  filter.orderBy = e.target.value;
  renderTodos();
});

const themeToggle = document.getElementById("theme-toggle");
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
themeToggle.addEventListener("change", (e) => {
  const theme = e.target.checked ? "light" : "dark";
  applyTheme(theme);
});

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    applyTheme(saved);
    themeToggle.checked = saved === "light";
  } else {
    applyTheme("dark");
    themeToggle.checked = false;
  }
}

const colorInput = document.getElementById("color-input");
function applyAccentColor(color) {
  document.documentElement.style.setProperty("--accent-color", color);
  document.documentElement.style.setProperty("--border-color", color);
  document.documentElement.style.setProperty("--placeholder-color", color);
  localStorage.setItem("accentColor", color);
}
colorInput.addEventListener("input", (e) => {
  applyAccentColor(e.target.value);
});

function initAccentColor() {
  const saved = localStorage.getItem("accentColor");
  if (saved) {
    applyAccentColor(saved);
    colorInput.value = saved;
  } else {
    applyAccentColor("#f9d342");
    colorInput.value = "#f9d342";
  }
}

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
});

loadTodos();
renderTodos();
initTheme();
initAccentColor();

// ------------ قابلیت اکسپورت و بکاپ -------------

// تبدیل todos به CSV
function todosToCSV(todosArr) {
  const headers = [
    "شناسه",
    "عنوان",
    "توضیحات",
    "سختی",
    "دسته‌بندی",
    "انجام شده",
    "تاریخ ساخت",
  ];
  const rows = todosArr.map((t) => [
    t.id,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.difficulty,
    `"${(t.category || "").replace(/"/g, '""')}"`,
    t.done ? "بله" : "خیر",
    new Date(t.createdAt).toLocaleString("fa-IR"),
  ]);
  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  return csvContent;
}

// اکسپورت JSON
document.getElementById("export-json-btn").addEventListener("click", () => {
  const jsonStr = JSON.stringify(todos, null, 2);
  downloadFile("todos.json", "application/json", jsonStr);
});

// اکسپورت CSV
document.getElementById("export-csv-btn").addEventListener("click", () => {
  const csv = todosToCSV(todos);
  downloadFile("todos.csv", "text/csv;charset=utf-8;", csv);
});

// اکسپورت PDF با jsPDF
document.getElementById("export-pdf-btn").addEventListener("click", () => {
  if (todos.length === 0) {
    alert("تودی برای اکسپورت وجود ندارد.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFontSize(16);
  doc.text("تودولست اکسپورت شده", pageWidth / 2, y, { align: "center" });
  y += 30;

  doc.setFontSize(12);
  todos.forEach((t, i) => {
    const title = `${i + 1}. ${t.title}`;
    const desc = t.description ? `توضیح: ${t.description}` : "";
    const diff = `سختی: ${
      "★".repeat(t.difficulty) + "☆".repeat(5 - t.difficulty)
    }`;
    const cat = t.category ? `دسته: ${t.category}` : "";
    const done = t.done ? "✅ انجام شده" : "❌ انجام نشده";
    let text = `${title}\n${desc}\n${diff}\n${cat}\n${done}\n\n`;

    const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
    if (
      y + splitText.length * 14 >
      doc.internal.pageSize.getHeight() - margin
    ) {
      doc.addPage();
      y = margin;
    }
    doc.text(splitText, margin, y);
    y += splitText.length * 14;
  });

  doc.save("todos.pdf");
});

// دانلود بکاپ JSON از تودوها (فایل متنی)
document.getElementById("backup-btn").addEventListener("click", () => {
  if (todos.length === 0) {
    alert("تودی برای بکاپ وجود ندارد.");
    return;
  }
  const jsonStr = JSON.stringify(todos, null, 2);
  downloadFile("todos-backup.json", "application/json", jsonStr);
});

// تابع کمکی برای دانلود فایل
function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
