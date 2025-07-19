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
  const inputDesc = document.getElementById("description");
  const inputCategory = document.getElementById("category");
  const selectDifficulty = document.getElementById("difficulty");
  const inputTimerDuration = document.getElementById("timerDuration");
  const todoListEl = document.getElementById("todoList");
  const themeSelect = document.getElementById("themeSwitcher");
  const sortSelect = document.getElementById("sort");
  const filterSelect = document.getElementById("filterSelect");
  const exportJsonBtn = document.getElementById("exportJson");
  const exportCsvBtn = document.getElementById("exportCsv");
  const searchInput = document.getElementById("search");

  const timers = new Map();
  let todos = getTodos();
  let theme = getTheme();

  // اعمال تم
  document.body.classList.add(theme);
  themeSelect.value = theme;

  // مخفی کردن لودر و نمایش اپ
  loader.style.display = "none";
  app.classList.remove("hidden");

  // پیام خطا
  const showError = (msg) => alert(msg);

  // اضافه کردن تودو
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = inputTitle.value.trim();
    if (title.length === 0) return showError("عنوان نمی‌تواند خالی باشد.");
    if (title.length > 100) return showError("عنوان باید کمتر از ۱۰۰ کاراکتر باشد.");

    const description = inputDesc.value.trim();
    if (description.length > 500) return showError("توضیحات باید کمتر از ۵۰۰ کاراکتر باشد.");

    const category = inputCategory.value.trim() || "عمومی";

    const difficulty = Number(selectDifficulty.value);
    if (!(difficulty >= 1 && difficulty <= 5)) return showError("سطح سختی معتبر نیست.");

    let timerDuration = Number(inputTimerDuration.value);
    if (isNaN(timerDuration) || timerDuration < 1 || timerDuration > 3600)
      return showError("مدت زمان تایمر باید بین 1 تا 3600 ثانیه باشد.");

    todos.push({
      id: Date.now(),
      title,
      description,
      category,
      difficulty,
      done: false,
      timerDuration,
      timerRemaining: timerDuration,
      timerRunning: false,
      createdAt: Date.now(),
    });

    saveTodos(todos);
    renderTodos();
    form.reset();
  });

  // رندر تودوها
  const renderTodos = () => {
    todoListEl.innerHTML = "";
    let filtered = [...todos];

    const filter = filterSelect ? filterSelect.value : "all";
    if (filter === "done") filtered = filtered.filter(t => t.done);
    else if (filter === "undone") filtered = filtered.filter(t => !t.done);
    else if (filter && filter.startsWith("difficulty_")) {
      const lvl = Number(filter.split("_")[1]);
      filtered = filtered.filter(t => t.difficulty === lvl);
    }

    const sort = sortSelect ? sortSelect.value : "newest";
    if (sort === "newest") filtered.sort((a,b) => b.createdAt - a.createdAt);
    else if (sort === "oldest") filtered.sort((a,b) => a.createdAt - b.createdAt);
    else if (sort === "difficulty") filtered.sort((a,b) => b.difficulty - a.difficulty);

    // فیلتر بر اساس جستجو
    const searchQuery = searchInput?.value.trim().toLowerCase() || "";
    if (searchQuery.length > 0) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery) ||
        todo.description.toLowerCase().includes(searchQuery) ||
        todo.category.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      todoListEl.innerHTML = "<p>تودی وجود ندارد.</p>";
      return;
    }

    filtered.forEach(todo => {
      const div = document.createElement("div");
      div.className = "todo-item" + (todo.done ? " done" : "");
      div.dataset.id = todo.id;

      const titleEl = document.createElement("div");
      titleEl.className = "title";
      titleEl.textContent = todo.title;
      div.appendChild(titleEl);

      if (todo.description) {
        const descEl = document.createElement("div");
        descEl.className = "description";
        descEl.textContent = todo.description;
        div.appendChild(descEl);
      }

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<span>دسته: ${todo.category}</span> <span class="difficulty">${"⭐".repeat(todo.difficulty)}</span>`;
      div.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "actions";

      const doneBtn = document.createElement("button");
      doneBtn.className = "done-btn";
      doneBtn.textContent = todo.done ? "بازگرداندن" : "انجام شده";
      doneBtn.onclick = () => {
        todo.done = !todo.done;
        saveTodos(todos);
        renderTodos();
      };

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "حذف";
      delBtn.onclick = () => {
        todos = todos.filter(t => t.id !== todo.id);
        saveTodos(todos);
        renderTodos();
      };

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "ویرایش";
      editBtn.onclick = () => {
        const newTitle = prompt("عنوان جدید:", todo.title);
        if (newTitle && newTitle.trim() !== "") todo.title = newTitle.trim();

        const newDesc = prompt("توضیحات جدید:", todo.description);
        if (newDesc !== null) todo.description = newDesc.trim();

        const newCat = prompt("دسته‌بندی جدید:", todo.category);
        if (newCat !== null) todo.category = newCat.trim();

        const newDiff = prompt("سختی جدید (1 تا 5):", todo.difficulty);
        const diffNum = Number(newDiff);
        if (!isNaN(diffNum) && diffNum >=1 && diffNum <=5) todo.difficulty = diffNum;

        const newTimer = prompt("مدت زمان تایمر (ثانیه):", todo.timerDuration);
        const timerNum = Number(newTimer);
        if (!isNaN(timerNum) && timerNum >=1 && timerNum <=3600) {
          todo.timerDuration = timerNum;
          if (todo.timerRemaining > timerNum) {
            todo.timerRemaining = timerNum;
          }
        }

        saveTodos(todos);
        renderTodos();
      };

      const timerBtn = document.createElement("button");
      timerBtn.className = "timer-btn";
      if (todo.timerRunning) {
        timerBtn.textContent = `توقف تایمر (${formatTime(todo.timerRemaining)})`;
      } else {
        timerBtn.textContent = `شروع تایمر (${formatTime(todo.timerRemaining)})`;
      }

      timerBtn.onclick = () => {
        if (todo.timerRunning) {
          todo.timerRunning = false;
          clearInterval(timers.get(todo.id));
          timers.delete(todo.id);
        } else {
          if (todo.timerRemaining <= 0) {
            todo.timerRemaining = todo.timerDuration;
          }
          todo.timerRunning = true;

          timers.set(todo.id, setInterval(() => {
            if (todo.timerRemaining > 0) {
              todo.timerRemaining--;
              saveTodos(todos);
              renderTodos();
            } else {
              todo.timerRunning = false;
              clearInterval(timers.get(todo.id));
              timers.delete(todo.id);
              saveTodos(todos);
              renderTodos();
              alert(`تایمر تودو "${todo.title}" به پایان رسید!`);
            }
          }, 1000));
        }
        saveTodos(todos);
        renderTodos();
      };

      actions.appendChild(doneBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      actions.appendChild(timerBtn);
      div.appendChild(actions);

      todoListEl.appendChild(div);
    });
  };

  themeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    document.body.classList.remove("light", "dark");
    document.body.classList.add(val);
    saveTheme(val);
  });

  if (sortSelect) sortSelect.addEventListener("change", renderTodos);
  if (filterSelect) filterSelect.addEventListener("change", renderTodos);
  if (searchInput) searchInput.addEventListener("input", renderTodos);

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

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderTodos();
});
