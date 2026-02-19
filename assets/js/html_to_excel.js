/* ==============================
   CONFIG
============================== */
const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/convert/htmltxt";

let outputFileName = "html_extracted.xlsx";
let downloadUrl = null;

/* ==============================
   PARTICLES
============================== */
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

/* ==============================
   FILE HANDLING
============================== */
const fileInput = document.getElementById("htmlFile");
const fileLabelText = document.getElementById("file-label-text");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    const fileName = fileInput.files[0].name;
    fileLabelText.textContent = fileName;
    outputFileName = fileName.replace(/\.(html|txt)$/i, ".xlsx");
  } else {
    fileLabelText.textContent = "Select HTML or TXT file";
  }
});

/* ==============================
   DOWNLOAD HANDLER
============================== */
async function handleDownload(resp) {
  const blob = await resp.blob();
  downloadUrl = URL.createObjectURL(blob);
  document.getElementById("downloadBox").style.display = "block";
}

document.getElementById("downloadBtn").onclick = () => {
  if (!downloadUrl) return;
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = outputFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/* ==============================
   CONVERT ACTION
============================== */
document.getElementById("go").onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select an HTML or TXT file.");

  const btn = document.getElementById("go");
  btn.disabled = true;
  btn.innerHTML = "⏳ Processing...";

  document.getElementById("status").innerText = "⏳ Uploading & processing...";
  document.getElementById("downloadBox").style.display = "none";

  const fd = new FormData();
  fd.append("file", file);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: fd,
    });

    await handleDownload(resp);
    document.getElementById("status").innerText =
      "✅ Extraction completed. Click Download.";
  } catch (err) {
    document.getElementById("status").innerText = "❌ " + err.message;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-gear"></i> Convert to Excel';
  }
};

/* ==============================
   THEME TOGGLE (UNCHANGED LOGIC)
============================== */
const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const text = document.getElementById("theme-text");

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

toggleBtn.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

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
