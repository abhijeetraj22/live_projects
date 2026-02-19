/* =====================================================
   CONFIG
===================================================== */
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/pdf/merge-compress";

/* =====================================================
   DOM REFERENCES
===================================================== */
const input = document.getElementById("files");
const label = document.getElementById("file-label-text");
const status = document.getElementById("status");
const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");
const mergeBtn = document.getElementById("mergeBtn");

const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");
const text = toggleBtn.querySelector("span");

let mergedBlob = null;

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
input.addEventListener("change", () => {
  if (input.files.length) {
    label.textContent = `${input.files.length} files selected`;
  }
});

/* =====================================================
   MERGE PDF
===================================================== */
mergeBtn.addEventListener("click", async () => {
  if (input.files.length < 2) {
    alert("Select at least 2 files");
    return;
  }

  const fd = new FormData();
  [...input.files].forEach(f => fd.append("files", f));

  status.textContent = "⏳ Merging files…";
  downloadBox.style.display = "none";
  mergeBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: fd
    });

    if (!res.ok) throw new Error("Merge failed");

    mergedBlob = await res.blob();
    status.textContent = "✅ Merge complete";
    downloadBox.style.display = "block";

  } catch (err) {
    status.textContent = "❌ " + err.message;
  } finally {
    mergeBtn.disabled = false;
  }
});

/* =====================================================
   DOWNLOAD
===================================================== */
downloadBtn.addEventListener("click", () => {
  if (!mergedBlob) return;

  let name = prompt("Enter file name to save:", "merged.pdf");
  if (!name) return;

  if (!name.toLowerCase().endsWith(".pdf")) {
    name += ".pdf";
  }

  const url = URL.createObjectURL(mergedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
