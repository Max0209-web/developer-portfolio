const charsets = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/|~"
};

const phraseWords = [
  "atlas", "river", "signal", "matrix", "pixel", "forest", "orbit", "stone",
  "vector", "harbor", "window", "silver", "garden", "thread", "kernel", "bridge",
  "planet", "violet", "sensor", "rocket", "cobalt", "summit", "canvas", "market",
  "winter", "circle", "anchor", "copper", "desert", "future", "module", "shadow"
];

const weakPatterns = [
  "password", "qwerty", "admin", "letmein", "welcome", "iloveyou", "monkey",
  "dragon", "football", "baseball", "vasiliev", "maksim", "maxim", "moscow"
];

const sequencePatterns = [
  "0123456789", "9876543210", "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop", "asdfghjkl", "zxcvbnm"
];

const form = document.querySelector("#password-form");
const output = document.querySelector("#password-output");
const lengthInput = document.querySelector("#length");
const lengthValue = document.querySelector("#length-value");
const strengthBar = document.querySelector("#strength-bar");
const strengthLabel = document.querySelector("#strength-label");
const entropyValue = document.querySelector("#entropy-value");
const statLength = document.querySelector("#stat-length");
const statPool = document.querySelector("#stat-pool");
const statTime = document.querySelector("#stat-time");
const tipsList = document.querySelector("#tips-list");
const copyButton = document.querySelector("#copy-password");
const clearButton = document.querySelector("#clear-password");
const randomOptions = document.querySelector("#random-options");
const phraseOptions = document.querySelector("#phrase-options");
const lengthField = document.querySelector("#length-field");

function randomIndex(max) {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;

  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % max;
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const next = randomIndex(index + 1);
    [items[index], items[next]] = [items[next], items[index]];
  }

  return items;
}

function selectedMode() {
  return new FormData(form).get("mode");
}

function selectedRandomSets() {
  return Object.entries(charsets)
    .filter(([key]) => document.querySelector(`#${key}`).checked)
    .map(([, value]) => value);
}

function generateRandomPassword() {
  const sets = selectedRandomSets();
  const length = Number(lengthInput.value);

  if (sets.length === 0) {
    document.querySelector("#lowercase").checked = true;
    sets.push(charsets.lowercase);
  }

  const all = sets.join("");
  const chars = sets.map((set) => set[randomIndex(set.length)]);

  while (chars.length < length) {
    chars.push(all[randomIndex(all.length)]);
  }

  return shuffle(chars).join("");
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generatePhrase() {
  const words = [];
  const used = new Set();

  while (words.length < 4) {
    const word = phraseWords[randomIndex(phraseWords.length)];
    if (!used.has(word)) {
      used.add(word);
      words.push(document.querySelector("#phrase-title").checked ? titleCase(word) : word);
    }
  }

  let phrase = words.join("-");

  if (document.querySelector("#phrase-number").checked) {
    phrase += `-${100 + randomIndex(900)}`;
  }

  if (document.querySelector("#phrase-symbol").checked) {
    const symbols = "!@#$%?";
    phrase += symbols[randomIndex(symbols.length)];
  }

  return phrase;
}

function poolSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[а-яё]/i.test(password)) size += 33;
  if (/\s/.test(password)) size += 1;
  if (/[^A-Za-zА-Яа-яЁё0-9\s]/.test(password)) size += 32;
  return Math.max(size, password.length > 0 ? 1 : 0);
}

function hasSequence(password) {
  const lower = password.toLowerCase();
  return sequencePatterns.some((pattern) => {
    for (let size = 4; size <= Math.min(pattern.length, 8); size += 1) {
      for (let index = 0; index <= pattern.length - size; index += 1) {
        if (lower.includes(pattern.slice(index, index + size))) return true;
      }
    }
    return false;
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds > 31536000 * 1000000000) return "более 1 млрд лет";
  if (seconds < 1) return "меньше секунды";

  const units = [
    ["год", 31536000],
    ["день", 86400],
    ["час", 3600],
    ["минута", 60],
    ["секунда", 1]
  ];

  for (const [label, value] of units) {
    if (seconds >= value) {
      const amount = Math.floor(seconds / value);
      return `${amount} ${label}`;
    }
  }

  return "меньше секунды";
}

function analyzePassword(password) {
  const length = password.length;
  const pool = poolSize(password);
  const entropy = length > 0 ? length * Math.log2(pool) : 0;
  const lower = password.toLowerCase();
  const tips = [];
  let penalty = 0;

  if (length === 0) {
    tips.push("Введите или сгенерируйте пароль.");
  } else {
    if (length < 15) {
      penalty += 22;
      tips.push("Увеличьте длину до 15 символов или больше.");
    }

    if (weakPatterns.some((pattern) => lower.includes(pattern))) {
      penalty += 32;
      tips.push("Уберите имена, популярные слова и очевидный контекст.");
    }

    if (/(.)\1{2,}/.test(password)) {
      penalty += 14;
      tips.push("Не используйте повтор одного символа несколько раз подряд.");
    }

    if (hasSequence(password)) {
      penalty += 18;
      tips.push("Избегайте последовательностей вроде 1234 или qwerty.");
    }

    if (pool < 36 && length < 22) {
      penalty += 10;
      tips.push("Добавьте другой тип символов или сделайте пароль длиннее.");
    }

    if (tips.length === 0) {
      tips.push("Пароль выглядит устойчивым для учебной модели оценки.");
      tips.push("Используйте его только для одного сервиса и храните в менеджере паролей.");
    }
  }

  const score = Math.max(0, Math.min(100, Math.round((entropy / 120) * 100 - penalty)));
  const guessesPerSecond = 10000000000;
  const seconds = entropy > 0 ? Math.pow(2, Math.min(entropy, 128)) / guessesPerSecond : 0;

  let label = "Нет пароля";
  let color = "#b42318";

  if (score >= 85) {
    label = "Очень надежный";
    color = "#0f766e";
  } else if (score >= 65) {
    label = "Надежный";
    color = "#2f855a";
  } else if (score >= 40) {
    label = "Средний";
    color = "#b45309";
  } else if (length > 0) {
    label = "Слабый";
    color = "#b42318";
  }

  return { length, pool, entropy, score, label, color, seconds, tips };
}

function renderAnalysis() {
  const analysis = analyzePassword(output.value);
  strengthBar.style.width = `${analysis.score}%`;
  strengthBar.style.background = analysis.color;
  strengthLabel.textContent = analysis.label;
  entropyValue.textContent = `${Math.round(analysis.entropy)} бит`;
  statLength.textContent = String(analysis.length);
  statPool.textContent = String(analysis.pool);
  statTime.textContent = analysis.length ? formatTime(analysis.seconds) : "нет данных";

  tipsList.replaceChildren(
    ...analysis.tips.map((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      return item;
    })
  );
}

function updateMode() {
  const phrase = selectedMode() === "phrase";
  randomOptions.classList.toggle("hidden", phrase);
  phraseOptions.classList.toggle("hidden", !phrase);
  lengthField.classList.toggle("hidden", phrase);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  output.value = selectedMode() === "phrase" ? generatePhrase() : generateRandomPassword();
  renderAnalysis();
});

form.addEventListener("input", (event) => {
  if (event.target === lengthInput) {
    lengthValue.textContent = lengthInput.value;
  }

  if (event.target.name === "mode") {
    updateMode();
  }

  if (event.target === output) {
    renderAnalysis();
  }
});

copyButton.addEventListener("click", async () => {
  if (!output.value) return;

  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard API is unavailable");
    }

    await navigator.clipboard.writeText(output.value);
  } catch {
    output.select();
    document.execCommand("copy");
    output.setSelectionRange(output.value.length, output.value.length);
  }

  copyButton.textContent = "Скопировано";
  window.setTimeout(() => {
    copyButton.textContent = "Скопировать";
  }, 1400);
});

clearButton.addEventListener("click", () => {
  output.value = "";
  renderAnalysis();
});

updateMode();
output.value = generateRandomPassword();
renderAnalysis();
