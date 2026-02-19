/* =====================================================
   CONFIG
===================================================== */
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/cbse/parse";

let excelBlob = null;

/* =====================================================
   DOM REFERENCES
===================================================== */
const processBtn = document.getElementById("processBtn");
const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");

const txtInput = document.getElementById("txtFile");
const fileLabel = document.getElementById("file-label-text");
const sampleInput = document.getElementById("sampleLine");
const gradeSelect = document.getElementById("grade");

const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const text = document.getElementById("theme-text");

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
   THEME TOGGLE
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

// Load saved theme
applyTheme(localStorage.getItem("theme") || "dark");

toggleBtn.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

/* =====================================================
   FILE INPUT LABEL
===================================================== */
txtInput.addEventListener("change", () => {
  if (txtInput.files.length > 0) {
    fileLabel.textContent = txtInput.files[0].name;
  } else {
    fileLabel.textContent = "Select TXT file";
  }
});

/* =====================================================
   PROCESS CBSE TXT → EXCEL
===================================================== */
processBtn.addEventListener("click", async () => {
  const file = txtInput.files[0];
  const sample = sampleInput.value.trim();
  const grade = gradeSelect.value;

  if (!file || !sample) {
    alert("Select TXT file and paste sample line");
    return;
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("sample_line", sample);
  fd.append("grade", grade);

  processBtn.disabled = true;
  processBtn.innerHTML = "⏳ Processing…";
  status.textContent = "⏳ Processing…";
  downloadBox.style.display = "none";
  excelBlob = null;

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: fd,
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || "Extraction failed");
    }

    excelBlob = await resp.blob();

    status.textContent =
      "✅ Extraction completed. Click Download to save Excel.";
    downloadBox.style.display = "block";
  } catch (err) {
    status.textContent = "❌ " + err.message;
  } finally {
    processBtn.disabled = false;
    processBtn.innerHTML = '<i class="fa fa-gear"></i> Generate Excel';
  }
});

/* =====================================================
   DOWNLOAD EXCEL
===================================================== */
downloadBtn.addEventListener("click", () => {
  if (!excelBlob) return;

  let name = prompt("Enter file name to save:", "cbse_result.xlsx");
  if (!name) return;

  if (!name.toLowerCase().endsWith(".xlsx")) {
    name += ".xlsx";
  }

  const url = URL.createObjectURL(excelBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
