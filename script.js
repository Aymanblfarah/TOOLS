const $ = (selector) => document.querySelector(selector);

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const todayText = $("#todayText");
const clockText = $("#clockText");
const notesCount = $("#notesCount");
const tasksCount = $("#tasksCount");

function updateClock() {
  const now = new Date();
  todayText.textContent = new Intl.DateTimeFormat("ar-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  clockText.textContent = new Intl.DateTimeFormat("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

setInterval(updateClock, 1000);
updateClock();

const calcDisplay = $("#calcDisplay");
let calcValue = "0";

function renderCalc() {
  calcDisplay.textContent = calcValue;
}

function appendCalc(value) {
  if (calcValue === "خطأ") calcValue = "0";
  if (value === "clear") calcValue = "0";
  else if (value === "back") calcValue = calcValue.length > 1 ? calcValue.slice(0, -1) : "0";
  else if (value === "equals") {
    try {
      const expression = calcValue.replace(/%/g, "/100");
      if (!/^[\d+\-*/().\s/]+$/.test(expression)) throw new Error("Invalid expression");
      const result = Function(`"use strict"; return (${expression})`)();
      calcValue = Number.isFinite(result) ? String(Math.round(result * 100000000) / 100000000) : "خطأ";
    } catch {
      calcValue = "خطأ";
    }
  } else {
    calcValue = calcValue === "0" ? value : calcValue + value;
  }
  renderCalc();
}

document.querySelectorAll("[data-calc]").forEach((button) => {
  button.addEventListener("click", () => appendCalc(button.dataset.calc));
});

let timerStartTime = 0;
let timerElapsed = 0;
let timerFrame = null;
const timerDisplay = $("#timerDisplay");
const timerStart = $("#timerStart");
const lapList = $("#lapList");

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds}.${tenths}`;
}

function tickTimer() {
  timerDisplay.textContent = formatTime(timerElapsed + Date.now() - timerStartTime);
  timerFrame = requestAnimationFrame(tickTimer);
}

timerStart.addEventListener("click", () => {
  if (timerFrame) {
    timerElapsed += Date.now() - timerStartTime;
    cancelAnimationFrame(timerFrame);
    timerFrame = null;
    timerStart.textContent = "بدء";
    return;
  }
  timerStartTime = Date.now();
  timerStart.textContent = "إيقاف";
  tickTimer();
});

$("#timerReset").addEventListener("click", () => {
  cancelAnimationFrame(timerFrame);
  timerFrame = null;
  timerElapsed = 0;
  timerStart.textContent = "بدء";
  timerDisplay.textContent = "00:00.0";
  lapList.innerHTML = "";
});

$("#timerLap").addEventListener("click", () => {
  const value = timerDisplay.textContent;
  if (value === "00:00.0") return;
  const item = document.createElement("li");
  item.textContent = value;
  lapList.prepend(item);
});

const convertType = $("#convertType");
const convertInput = $("#convertInput");
const convertResult = $("#convertResult");

function updateConversion() {
  const value = Number(convertInput.value || 0);
  const converters = {
    "km-mi": [value * 0.621371, "كم", "ميل"],
    "mi-km": [value * 1.60934, "ميل", "كم"],
    "kg-lb": [value * 2.20462, "كغ", "رطل"],
    "lb-kg": [value * 0.453592, "رطل", "كغ"],
    "c-f": [value * 1.8 + 32, "°م", "°ف"],
    "f-c": [(value - 32) / 1.8, "°ف", "°م"],
  };
  const [result, from, to] = converters[convertType.value];
  convertResult.textContent = `${value} ${from} = ${Number(result.toFixed(2))} ${to}`;
}

convertType.addEventListener("change", updateConversion);
convertInput.addEventListener("input", updateConversion);
updateConversion();

const passwordOutput = $("#passwordOutput");
const passwordLength = $("#passwordLength");
const passwordLengthText = $("#passwordLengthText");
const symbolChars = "!@#$%^&*()-_=+[]{}";
const numberChars = "0123456789";
const letterChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generatePassword() {
  const length = Number(passwordLength.value);
  let chars = letterChars;
  if ($("#useSymbols").checked) chars += symbolChars;
  if ($("#useNumbers").checked) chars += numberChars;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  passwordOutput.textContent = Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

passwordLength.addEventListener("input", () => {
  passwordLengthText.textContent = passwordLength.value;
  generatePassword();
});

$("#useSymbols").addEventListener("change", generatePassword);
$("#useNumbers").addEventListener("change", generatePassword);
$("#generatePassword").addEventListener("click", generatePassword);
$("#copyPassword").addEventListener("click", async () => {
  await navigator.clipboard.writeText(passwordOutput.textContent);
  $("#copyPassword").textContent = "تم";
  setTimeout(() => {
    $("#copyPassword").textContent = "نسخ";
  }, 1200);
});
generatePassword();

const notesInput = $("#notesInput");
notesInput.value = storage.get("basic-tools-notes", "");

function updateNotesCount() {
  const count = notesInput.value.trim() ? notesInput.value.trim().split(/\s+/).length : 0;
  notesCount.textContent = String(count);
}

notesInput.addEventListener("input", () => {
  storage.set("basic-tools-notes", notesInput.value);
  updateNotesCount();
});
updateNotesCount();

let tasks = storage.get("basic-tools-tasks", []);
const taskList = $("#taskList");

function saveTasks() {
  storage.set("basic-tools-tasks", tasks);
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const actions = document.createElement("div");
    const done = document.createElement("button");
    const remove = document.createElement("button");

    text.className = `task-item${task.done ? " done" : ""}`;
    text.textContent = task.text;
    actions.className = "task-actions";
    done.type = "button";
    done.textContent = task.done ? "فتح" : "تم";
    remove.type = "button";
    remove.textContent = "حذف";

    done.addEventListener("click", () => {
      tasks = tasks.map((itemTask) => itemTask.id === task.id ? { ...itemTask, done: !itemTask.done } : itemTask);
      saveTasks();
      renderTasks();
    });

    remove.addEventListener("click", () => {
      tasks = tasks.filter((itemTask) => itemTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(done, remove);
    item.append(text, actions);
    taskList.append(item);
  });
  tasksCount.textContent = String(tasks.filter((task) => !task.done).length);
}

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: crypto.randomUUID(), text, done: false });
  input.value = "";
  saveTasks();
  renderTasks();
});

renderTasks();
