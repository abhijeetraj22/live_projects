/* =====================================================
   CONFIG
===================================================== */

//const API_URL = "http://127.0.0.1:8000/convert/excel";
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/convert/excel";

let outputFileName = "converted.xlsx";
let excelBlob = null;

/* =====================================================
DOM REFERENCES
===================================================== */

const pdfInput = document.getElementById("pdfFile");
const fileLabelText = document.getElementById("file-label-text");

const status = document.getElementById("status");
const downloadBox = document.getElementById("downloadBox");

const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");
const text = toggleBtn.querySelector("span");

const startPageInput = document.getElementById("startPage");
const endPageInput = document.getElementById("endPage");

const singleBtn = document.getElementById("singleSheet");
const multiBtn = document.getElementById("multiSheet");

const pdfType = document.getElementById("pdfType");
const textMethods = document.getElementById("textMethods");
const imageMethods = document.getElementById("imageMethods");

const textMethodButtons = document.querySelectorAll("#textMethods .method-btn");
const imageMethodButtons = document.querySelectorAll(
  "#imageMethods .method-btn",
);

const selectedMethodText = document.getElementById("selectedMethodText");
const methodLabels = {
  grid: "Table Grid",
  lattice: "Structural Table",
  stream: "Free Text Table",
  text: "Simple Text",
  ocr: "OCR (Image Recognition)",
  hybrid: "Hybrid (Text + OCR)",
};

/* =====================================================
PARTICLES
===================================================== */

function initParticles() {
  if (document.documentElement.dataset.theme !== "dark") return;

  particlesJS("particles-js", {
    particles: {
      number: { value: 40 },
      color: { value: "#4da3ff" },
      size: { value: 2 },
      move: { speed: 0.6 },
      line_linked: { enable: false },
    },
    interactivity: {
      events: { onhover: { enable: true, mode: "repulse" } },
    },
  });
}

function destroyParticles() {
  const el = document.getElementById("particles-js");
  if (el) el.innerHTML = "";
}

/* =====================================================
THEME
===================================================== */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);

  if (theme === "light") {
    icon.className = "fa fa-sun";
    text.textContent = "Light";
    destroyParticles();
  } else {
    icon.className = "fa fa-moon";
    text.textContent = "Dark";
    destroyParticles();
    initParticles();
  }
}

applyTheme(localStorage.getItem("theme") || "dark");

toggleBtn.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

/* =====================================================
METHOD SELECTION
===================================================== */

/*let selectedMethod = "grid";

function activateMethod(buttonGroup, btn) {
  buttonGroup.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedMethod = btn.dataset.method;
}*/

function activateMethod(buttonGroup, btn) {
  buttonGroup.forEach((b) => b.classList.remove("active"));

  btn.classList.add("active");

  selectedMethod = btn.dataset.method;

  if (methodLabels[selectedMethod]) {
    selectedMethodText.textContent = methodLabels[selectedMethod];
  }
}

/* TEXT METHODS */

textMethodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    activateMethod(textMethodButtons, btn);
  });
});

/* OCR METHODS */

imageMethodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    activateMethod(imageMethodButtons, btn);
  });
});

/* =====================================================
PDF TYPE SWITCH
===================================================== */

/*pdfType.addEventListener("change", () => {
  if (pdfType.value === "image") {
    textMethods.style.display = "none";
    imageMethods.style.display = "block";

    imageMethodButtons.forEach((b) => b.classList.remove("active"));
    imageMethodButtons[0].classList.add("active");

    selectedMethod = imageMethodButtons[0].dataset.method;
  } else {
    textMethods.style.display = "block";
    imageMethods.style.display = "none";

    textMethodButtons.forEach((b) => b.classList.remove("active"));
    textMethodButtons[0].classList.add("active");

    selectedMethod = textMethodButtons[0].dataset.method;
  }
});*/

pdfType.addEventListener("change", () => {
  if (pdfType.value === "image") {
    imageMethods.style.display = "flex";
    textMethods.style.display = "none";

    imageMethodButtons.forEach((b) => b.classList.remove("active"));
    imageMethodButtons[0].classList.add("active");

    selectedMethod = imageMethodButtons[0].dataset.method;
  } else {
    textMethods.style.display = "flex";
    imageMethods.style.display = "none";

    textMethodButtons.forEach((b) => b.classList.remove("active"));
    textMethodButtons[0].classList.add("active");

    selectedMethod = textMethodButtons[0].dataset.method;
  }

  if (methodLabels[selectedMethod]) {
    selectedMethodText.textContent = methodLabels[selectedMethod];
  }
});

/* =====================================================
FILE INPUT
===================================================== */

pdfInput.addEventListener("change", function () {
  if (this.files && this.files.length > 0) {
    const pdfName = this.files[0].name;

    fileLabelText.textContent = pdfName;

    outputFileName = pdfName.replace(/\.pdf$/i, ".xlsx");
  } else {
    fileLabelText.textContent = "Select PDF file";
  }
});

/* =====================================================
TOKEN
===================================================== */

function getStoredToken() {
  return localStorage.getItem("userToken") || "";
}

function saveToken(t) {
  if (t) localStorage.setItem("userToken", t);
}

/* =====================================================
UI CONTROL
===================================================== */

function toggleUI(state) {
  pdfInput.disabled = state;
  startPageInput.disabled = state;
  endPageInput.disabled = state;

  singleBtn.disabled = state;
  multiBtn.disabled = state;

  textMethodButtons.forEach((btn) => (btn.disabled = state));
  imageMethodButtons.forEach((btn) => (btn.disabled = state));
}

/* =====================================================
DOWNLOAD
===================================================== */

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!excelBlob) return;

  const url = URL.createObjectURL(excelBlob);

  const a = document.createElement("a");

  a.href = url;
  a.download = outputFileName;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
});

/* =====================================================
CONVERT FUNCTION
===================================================== */

async function convertPDF(mode, method) {
  const file = pdfInput.files[0];

  if (!file) {
    status.textContent = "❌ Please select a PDF file.";
    return;
  }

  const startPage = startPageInput.value.trim();
  const endPage = endPageInput.value.trim();

  if (!startPage || !endPage) {
    status.textContent = "❌ Please enter page number range.";
    return;
  }

  if (parseInt(startPage) > parseInt(endPage)) {
    status.textContent = "❌ Start page cannot be greater than End page.";
    return;
  }

  if (endPage - startPage + 1 > 20) {
    status.textContent = "❌ Maximum 20 pages allowed.";
    return;
  }

  const fd = new FormData();

  fd.append("file", file);
  fd.append("mode", mode);
  fd.append("method", method);

  fd.append("start_page", startPage);
  fd.append("end_page", endPage);

  const token = getStoredToken();

  if (token) fd.append("token", token);

  status.textContent = "⏳ Processing PDF...";
  downloadBox.style.display = "none";

  toggleUI(true);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "X-API-Key": "your-strong-secret-key-123" },
      body: fd,
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || "Conversion failed");
    }

    excelBlob = await resp.blob();

    if (!excelBlob || excelBlob.size === 0) {
      throw new Error("Empty Excel file received");
    }

    downloadBox.style.display = "block";
    status.textContent = "✅ Conversion completed. Click Download.";
  } catch (err) {
    status.textContent = "❌ " + err.message;
  } finally {
    toggleUI(false);
  }
}

/* =====================================================
BUTTON EVENTS
===================================================== */

singleBtn.addEventListener("click", () => {
  convertPDF("single", selectedMethod);
});

multiBtn.addEventListener("click", () => {
  convertPDF("multi", selectedMethod);
});

selectedMethodText.textContent = methodLabels[selectedMethod];
