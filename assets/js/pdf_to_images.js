/* =====================================================
   CONFIG
===================================================== */
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/pdf/convert-to-zip";

let zipFileName = "pdf_images.zip";

/* =====================================================
   DOM REFERENCES
===================================================== */
const pdfInput = document.getElementById("pdfFile");
const fileLabel = document.getElementById("file-label-text");
const status = document.getElementById("status");

const startPageInput = document.getElementById("startPage");
const endPageInput = document.getElementById("endPage");

const convertBtn = document.getElementById("convertBtn");
const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");

const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");
const text = toggleBtn.querySelector("span");

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
      line_linked: { enable: false }
    },
    interactivity: {
      events: { onhover: { enable: true, mode: "repulse" } }
    }
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
   FILE INPUT
===================================================== */
pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length) {
    const pdfName = pdfInput.files[0].name;
    fileLabel.textContent = pdfName;
    zipFileName = pdfName.replace(/\.pdf$/i, "_images.zip");
  } else {
    fileLabel.textContent = "Select PDF file";
    zipFileName = "pdf_images.zip";
  }
});

/* =====================================================
   PDF → IMAGES ZIP
===================================================== */
convertBtn.addEventListener("click", async () => {
  if (!pdfInput.files.length) {
    alert("Select a PDF");
    return;
  }

  const fd = new FormData();
  fd.append("file", pdfInput.files[0]);
  fd.append("start_page", startPageInput.value || 1);
  fd.append("end_page", endPageInput.value || 99999);
  fd.append("image_format", "png");

  status.textContent = "⏳ Converting PDF…";
  downloadBox.style.display = "none";
  convertBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: fd
    });

    if (!res.ok) throw new Error("Conversion failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    downloadBox.style.display = "block";
    status.textContent = "✅ Conversion complete. Click Download.";

  } catch (err) {
    status.textContent = "❌ " + err.message;
  } finally {
    convertBtn.disabled = false;
  }
});
