/* =====================================================
   CONFIG
===================================================== */
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/convert/excel";

let outputFileName = "converted.xlsx";

/* =====================================================
   DOM REFERENCES
===================================================== */
const pdfInput = document.getElementById("pdfFile");
const fileLabelText = document.getElementById("file-label-text");

const goBtn = document.getElementById("convertExcel");
const status = document.getElementById("status");
const downloadBox = document.getElementById("downloadBox");

const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");
const text = toggleBtn.querySelector("span");
let excelBlob = null;

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
   TOKEN HELPERS
===================================================== */
function getStoredToken() {
  return localStorage.getItem("userToken") || "";
}

function saveToken(t) {
  if (t) localStorage.setItem("userToken", t);
}
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
   FILE INPUT
===================================================== */
pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length > 0) {
    const pdfName = pdfInput.files[0].name;
    fileLabelText.textContent = pdfName;
    outputFileName = pdfName.replace(/\.pdf$/i, ".xlsx");
  } else {
    fileLabelText.textContent = "Select PDF file";
    outputFileName = "converted.xlsx";
  }
});

/* =====================================================
   DOWNLOAD HANDLER
===================================================== */
async function handleDownload(resp) {
  excelBlob = await resp.blob();

  if (!excelBlob || excelBlob.size === 0) {
    throw new Error("Empty Excel file received");
  }

  downloadBox.style.display = "block";
}

/* =====================================================
   PDF → EXCEL
===================================================== */
goBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (!file) {
    alert("Please select a PDF.");
    return;
  }

  goBtn.disabled = true;
  goBtn.innerHTML = "⏳ Processing...";
  status.textContent = "⏳ Uploading & processing...";
  downloadBox.style.display = "none";

  const fd = new FormData();
  fd.append("file", file);

  const token = getStoredToken();
  if (token) fd.append("token", token);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: fd,
    });

    const newToken = resp.headers.get("x-user-token");
    if (newToken) saveToken(newToken);

    if (!resp.ok) throw new Error("Conversion failed");

    await handleDownload(resp);
    status.textContent =
      "✅ Conversion completed. Click Download to save Excel.";
  } catch (err) {
    status.textContent = "❌ " + err.message;
  } finally {
    goBtn.disabled = false;
    goBtn.innerHTML = '<i class="fa fa-gear"></i> Convert to Excel';
  }
});
