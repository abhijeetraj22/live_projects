/* =====================================================
   CONFIG
===================================================== */
const TXT_API = "http://127.0.0.1:8000/cbse/parse";
const PDF_LOC_API = "http://127.0.0.1:8000/cbse_loc_pdf_extract";
const PDF_REG_API = "http://127.0.0.1:8000/cbse_reg_pdf_extract";

let excelBlob = null;
let mode = "txt"; // default mode

/* =====================================================
   DOM REFERENCES
===================================================== */
const processBtn = document.getElementById("processBtn");
const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");

const txtInput = document.getElementById("txtFile");
const pdfInput = document.getElementById("pdfFile");

const txtLabel = document.getElementById("txt-label");
const pdfLabel = document.getElementById("pdf-label");

const sampleInput = document.getElementById("sampleLine");
const gradeSelect = document.getElementById("grade");

const txtSection = document.getElementById("txtSection");

const txtModeBtn = document.getElementById("txtModeBtn");
const pdfModeBtn = document.getElementById("pdfModeBtn");

const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const text = document.getElementById("theme-text");

/* =====================================================
   MODE SWITCH
===================================================== */
txtModeBtn.addEventListener("click", () => {
  mode = "txt";

  txtSection.style.display = "block";
  sampleInput.style.display = "block";
  processBtn.style.display = "block";

  document.getElementById("pdfTypeBox").style.display = "none";
  document.getElementById("pdfUploadBox").style.display = "none";
  document.getElementById("gradeBox").style.display = "block";
  // 🔥 RESET UI
  downloadBox.style.display = "none";
  status.innerText = "";
  excelBlob = null;

  // highlight
  txtModeBtn.style.opacity = "1";
  pdfModeBtn.style.opacity = "0.5";
});

pdfModeBtn.addEventListener("click", () => {
  mode = "pdf";

  txtSection.style.display = "none";
  sampleInput.style.display = "none";
  processBtn.style.display = "none";

  document.getElementById("pdfTypeBox").style.display = "block";
  document.getElementById("gradeBox").style.display = "none";
  // 🔥 RESET UI
  downloadBox.style.display = "none";
  status.innerText = "";
  excelBlob = null;

  // highlight
  pdfModeBtn.style.opacity = "1";
  txtModeBtn.style.opacity = "0.5";
});

/* =====================================================
   FILE LABEL
===================================================== */
txtInput.addEventListener("change", () => {
  txtLabel.textContent =
    txtInput.files.length > 0 ? txtInput.files[0].name : "Select TXT file";
});

pdfInput.addEventListener("change", () => {
  const fileNameBox = document.getElementById("pdfFileName");

  fileNameBox.textContent =
    pdfInput.files.length > 0 ? pdfInput.files[0].name : "Select PDF file";
});

/* =====================================================
   DRAG & DROP (TXT ONLY)
===================================================== */
txtSection.addEventListener("dragover", (e) => {
  e.preventDefault();
  txtSection.style.border = "2px dashed #4da3ff";
});

txtSection.addEventListener("dragleave", () => {
  txtSection.style.border = "";
});

txtSection.addEventListener("drop", (e) => {
  e.preventDefault();
  txtSection.style.border = "";

  const file = e.dataTransfer.files[0];

  if (file && file.name.endsWith(".txt")) {
    txtInput.files = e.dataTransfer.files;
    txtLabel.textContent = file.name;
  } else {
    alert("Please drop a valid TXT file");
  }
});

/* =====================================================
   PROCESS BUTTON (SMART SWITCH)
===================================================== */
processBtn.addEventListener("click", async () => {
  const sample = sampleInput.value.trim();
  const grade = gradeSelect.value;

  let file, apiUrl;

  if (mode === "txt") {
    file = txtInput.files[0];
    apiUrl = TXT_API;
  } else {
    file = pdfInput.files[0];
    apiUrl = PDF_API;
  }

  if (!file || !sample) {
    alert("Select file and paste sample line");
    return;
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("sample_line", sample);
  fd.append("grade", grade);

  processBtn.disabled = true;
  const oldText = processBtn.innerHTML;
  processBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

  downloadBox.style.display = "none";
  excelBlob = null;

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      body: fd,
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || "Extraction failed");
    }

    excelBlob = await resp.blob();

    status.textContent = `✅ ${mode.toUpperCase()} processed successfully`;
    downloadBox.style.display = "block";
  } catch (err) {
    console.error(err);
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

  // 🔥 DEFAULT NAME BASED ON MODE
  let defaultName = mode === "txt" ? "cbse_result.xlsx" : "cbse_data.xlsx";

  // 🔥 PROMPT WITH DEFAULT NAME
  let name = prompt("Enter file name:", defaultName);
  if (!name) return;

  // 🔥 ENSURE .xlsx EXTENSION
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

  // 🔥 CLEAN MEMORY (IMPORTANT)
  URL.revokeObjectURL(url);
});

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

applyTheme(localStorage.getItem("theme") || "dark");

toggleBtn.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

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
   PDF TYPE
===================================================== */
let selectedPDFType = "";

const regBtn = document.getElementById("regBtn");
const locBtn = document.getElementById("locBtn");
const pdfUploadBox = document.getElementById("pdfUploadBox");

regBtn.onclick = () => {
  selectedPDFType = "REGIST";

  pdfUploadBox.style.display = "block";

  // highlight
  regBtn.style.opacity = "1";
  locBtn.style.opacity = "0.5";

  // 🔥 RESET EVERYTHING
  pdfInput.value = "";
  document.getElementById("pdfFileName").textContent = "Select PDF file";
  downloadBox.style.display = "none";
  status.innerText = "";
  excelBlob = null;
};

locBtn.onclick = () => {
  selectedPDFType = "LOC";

  pdfUploadBox.style.display = "block";

  // highlight
  locBtn.style.opacity = "1";
  regBtn.style.opacity = "0.5";

  // 🔥 RESET EVERYTHING
  pdfInput.value = "";
  document.getElementById("pdfFileName").textContent = "Select PDF file";
  downloadBox.style.display = "none";
  status.innerText = "";
  excelBlob = null;
};

/* CONVERT BUTTON */
convertPdfBtn.onclick = () => {
  if (!selectedPDFType) {
    alert("Select REGIST or LOC first");
    return;
  }

  processPDF(selectedPDFType);
};
/* =====================================================
   PDF PROCESS
===================================================== */
function processPDF(type) {
  const file = pdfInput.files[0];

  if (!file) {
    alert("Select PDF file");
    return;
  }

  // 🔥 SELECT API BASED ON TYPE
  let apiUrl = "";

  if (type === "REGIST") {
    apiUrl = PDF_REG_API;
  } else if (type === "LOC") {
    apiUrl = PDF_LOC_API;
  }

  status.innerText = "Processing " + type + " PDF...";

  let formData = new FormData();
  formData.append("file", file);
  formData.append("grade", gradeSelect.value);

  fetch(apiUrl, {
    method: "POST",
    body: formData,
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server error");
      }
      return res.blob();
    })
    .then((blob) => {
      excelBlob = blob; // ✅ store globally

      downloadBox.style.display = "block";
      status.innerText = "Done ✅";
    })
    .catch((err) => {
      console.error(err);
      status.innerText = "❌ " + err.message;
    });
}

/* =====================================================
   TXT PROCESS
=====================================================
processBtn.addEventListener("click", async () => {
  const file = txtInput.files[0];
  const sample = sampleInput.value.trim();

  if (!file || !sample) {
    alert("Select file and paste sample line");
    return;
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("sample_line", sample);
  fd.append("grade", gradeSelect.value);

  processBtn.disabled = true;
  processBtn.innerHTML = "Processing...";

  try {
    const resp = await fetch(TXT_API, {
      method: "POST",
      body: fd,
    });

    excelBlob = await resp.blob();

    status.innerText = "Done ✅";
    downloadBox.style.display = "block";
  } catch {
    status.innerText = "Error ❌";
  } finally {
    processBtn.disabled = false;
    processBtn.innerHTML = "Generate Excel";
  }
}); */
/* =====================================================
   DOWNLOAD
===================================================== */
downloadBtn.addEventListener("click", () => {
  if (!excelBlob) return;

  const url = URL.createObjectURL(excelBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cbse_result.xlsx";
  a.click();
});
