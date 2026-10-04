/* =====================================================
   CONFIG — replace the previous script with this entire file.
   Load it after the page HTML, or use <script defer src="...">.
===================================================== */
const TXT_API = "https://pdf-to-excel-api-smdv.onrender.com/cbse/parse";
const PDF_LOC_API =
  "https://pdf-to-excel-api-smdv.onrender.com/cbse_loc_pdf_extract";
const PDF_REG_API =
  "https://pdf-to-excel-api-smdv.onrender.com/cbse_reg_pdf_extract";

let excelBlob = null;
let mode = "txt";
let selectedPDFType = "";
let processing = false;
let downloadName = "cbse_result.xlsx";

/* =====================================================
   DOM REFERENCES
===================================================== */
const processBtn = document.getElementById("processBtn");
const convertPdfBtn = document.getElementById("convertPdfBtn");
const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const txtInput = document.getElementById("txtFile");
const pdfInput = document.getElementById("pdfFile");
const txtLabel = document.getElementById("txt-label");
const pdfFileName = document.getElementById("pdfFileName");
const sampleInput = document.getElementById("sampleLine");
const gradeSelect = document.getElementById("grade");
const gradeBox = document.getElementById("gradeBox");
const txtSection = document.getElementById("txtSection");
const txtModeBtn = document.getElementById("txtModeBtn");
const pdfModeBtn = document.getElementById("pdfModeBtn");
const pdfTypeBox = document.getElementById("pdfTypeBox");
const pdfUploadBox = document.getElementById("pdfUploadBox");
const regBtn = document.getElementById("regBtn");
const locBtn = document.getElementById("locBtn");
const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

/* =====================================================
   API KEY — entered by the operator, never saved by this script.
   Reuses an existing input with id="cbseApiKey" if present.
===================================================== */
let apiKeyInput = document.getElementById("cbseApiKey");
if (!apiKeyInput) {
  const keyBox = document.createElement("div");
  keyBox.id = "cbseApiKeyBox";
  keyBox.style.margin = "12px 0";

  const label = document.createElement("label");
  label.htmlFor = "cbseApiKey";
  label.textContent = "API key";
  label.style.display = "block";

  apiKeyInput = document.createElement("input");
  apiKeyInput.id = "cbseApiKey";
  apiKeyInput.type = "password";
  apiKeyInput.autocomplete = "off";
  apiKeyInput.spellcheck = false;
  apiKeyInput.placeholder = "Enter your API key";
  apiKeyInput.style.width = "100%";
  apiKeyInput.style.boxSizing = "border-box";
  apiKeyInput.style.padding = "10px";

  keyBox.appendChild(label);
  keyBox.appendChild(apiKeyInput);
  // Place outside the TXT/PDF sections so it remains visible in either mode.
  const anchor = status || processBtn;
  anchor.parentNode.insertBefore(keyBox, anchor);
}

/* =====================================================
   SHARED REQUEST / STATUS HANDLING
===================================================== */
function resetResult() {
  excelBlob = null;
  downloadBox.style.display = "none";
  status.textContent = "";
}

function getApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.focus();
    throw new Error("Enter the API key before uploading.");
  }
  return key;
}

async function errorMessage(response) {
  const raw = await response.text();
  let message = raw;
  try {
    const data = JSON.parse(raw);
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((item) => item.msg || "Invalid request")
        .join("; ");
    }
  } catch (_) {
    // A gateway may return an HTML error page instead of FastAPI JSON.
    if (/<(?:!doctype|html|body)\b/i.test(raw)) message = "";
  }
  if (response.status === 401) {
    return "Unauthorized: enter the key that matches API_SECRET in Render's Environment settings.";
  }
  if (response.status === 429) {
    return (
      message ||
      "Daily request limit reached. Try again after the quota resets."
    );
  }
  if (response.status === 503) {
    return (
      message ||
      "The server is busy or temporarily unavailable. Please retry shortly."
    );
  }
  return message || `Request failed (HTTP ${response.status}).`;
}

async function requestExcel(apiUrl, formData, key) {
  let response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "X-API-Key": key },
      body: formData,
      // FormData sets Content-Type and its multipart boundary automatically.
    });
  } catch (_) {
    throw new Error(
      "Could not reach the service. Check your connection and Render logs; if the browser reports CORS, check ALLOWED_ORIGIN.",
    );
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  const blob = await response.blob();
  if (!blob.size) throw new Error("The server returned an empty file.");
  return blob;
}

function validateUpload(file, extension) {
  if (!file) throw new Error(`Select a ${extension.toUpperCase()} file.`);
  if (!file.name.toLowerCase().endsWith(`.${extension}`)) {
    throw new Error(`Select a valid ${extension.toUpperCase()} file.`);
  }
  if (file.size > 10 * 1024 * 1024)
    throw new Error("The file must be 10 MB or smaller.");
  if (file.size === 0) throw new Error("The selected file is empty.");
}

async function runConversion(button, label, apiUrl, formData, filename) {
  if (processing) return;
  resetResult();
  let key;
  try {
    key = getApiKey();
  } catch (error) {
    status.textContent = "❌ " + error.message;
    return;
  }

  processing = true;
  resetResult();
  status.textContent = `Processing ${label}...`;
  const oldText = button.innerHTML;
  button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
  const controls = [
    processBtn,
    convertPdfBtn,
    txtModeBtn,
    pdfModeBtn,
    regBtn,
    locBtn,
    txtInput,
    pdfInput,
    sampleInput,
    gradeSelect,
    apiKeyInput,
  ];
  const states = controls.map((control) => [control, control.disabled]);
  controls.forEach((control) => {
    control.disabled = true;
  });
  try {
    excelBlob = await requestExcel(apiUrl, formData, key);
    downloadName = filename;
    status.textContent = `✅ ${label} processed successfully`;
    downloadBox.style.display = "block";
  } catch (error) {
    excelBlob = null;
    status.textContent = "❌ " + error.message;
  } finally {
    states.forEach(([control, wasDisabled]) => {
      control.disabled = wasDisabled;
    });
    button.innerHTML = oldText;
    processing = false;
  }
}

/* =====================================================
   MODE SWITCH / PDF TYPE
===================================================== */
function updateMode() {
  const isTxt = mode === "txt";
  txtSection.style.display = isTxt ? "block" : "none";
  sampleInput.style.display = isTxt ? "block" : "none";
  processBtn.style.display = isTxt ? "block" : "none";
  pdfTypeBox.style.display = isTxt ? "none" : "block";
  pdfUploadBox.style.display = !isTxt && selectedPDFType ? "block" : "none";
  // REG may require a grade; LOC detects Class X / XII from PDF headers.
  gradeBox.style.display =
    isTxt || selectedPDFType === "REGIST" ? "block" : "none";
  txtModeBtn.style.opacity = isTxt ? "1" : "0.5";
  pdfModeBtn.style.opacity = isTxt ? "0.5" : "1";
}

txtModeBtn.addEventListener("click", () => {
  if (processing) return;
  mode = "txt";
  resetResult();
  updateMode();
});
pdfModeBtn.addEventListener("click", () => {
  if (processing) return;
  mode = "pdf";
  resetResult();
  updateMode();
});

function choosePDF(type) {
  if (processing) return;
  selectedPDFType = type;
  pdfInput.value = "";
  pdfFileName.textContent = "Select PDF file";
  regBtn.style.opacity = type === "REGIST" ? "1" : "0.5";
  locBtn.style.opacity = type === "LOC" ? "1" : "0.5";
  resetResult();
  updateMode();
}
regBtn.onclick = () => choosePDF("REGIST");
locBtn.onclick = () => choosePDF("LOC");

/* =====================================================
   FILE LABELS / DRAG AND DROP
===================================================== */
txtInput.addEventListener("change", () => {
  resetResult();
  txtLabel.textContent = txtInput.files.length
    ? txtInput.files[0].name
    : "Select TXT file";
});
pdfInput.addEventListener("change", () => {
  resetResult();
  pdfFileName.textContent = pdfInput.files.length
    ? pdfInput.files[0].name
    : "Select PDF file";
});
txtSection.addEventListener("dragover", (event) => {
  event.preventDefault();
  if (!processing) txtSection.style.border = "2px dashed #4da3ff";
});
txtSection.addEventListener("dragleave", () => {
  txtSection.style.border = "";
});
txtSection.addEventListener("drop", (event) => {
  event.preventDefault();
  txtSection.style.border = "";
  if (processing) return;
  const file = event.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith(".txt")) {
    txtInput.files = event.dataTransfer.files;
    txtLabel.textContent = file.name;
    resetResult();
  } else {
    alert("Please drop a valid TXT file");
  }
});

/* =====================================================
   TXT PROCESS
===================================================== */
processBtn.addEventListener("click", async () => {
  if (processing || mode !== "txt") return;
  resetResult();
  try {
    const file = txtInput.files[0];
    validateUpload(file, "txt");
    const sample = sampleInput.value.trim();
    if (!sample) throw new Error("Paste the sample line.");
    const grade = gradeSelect.value;
    if (!["10", "12"].includes(grade))
      throw new Error("Select Class X or Class XII.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sample_line", sample);
    formData.append("grade", grade);
    await runConversion(
      processBtn,
      "TXT",
      TXT_API,
      formData,
      "cbse_result.xlsx",
    );
  } catch (error) {
    status.textContent = "❌ " + error.message;
  }
});

/* =====================================================
   PDF PROCESS
===================================================== */
async function processPDF(type) {
  if (processing) return;
  resetResult();
  try {
    if (!["REGIST", "LOC"].includes(type))
      throw new Error("Select REGIST or LOC first.");
    const file = pdfInput.files[0];
    validateUpload(file, "pdf");
    const formData = new FormData();
    formData.append("file", file);
    if (type === "REGIST") {
      const grade = gradeSelect.value;
      if (!["9", "10", "11", "12"].includes(grade))
        throw new Error("Select the registration class.");
      formData.append("grade", grade);
    }
    await runConversion(
      convertPdfBtn,
      `${type} PDF`,
      type === "REGIST" ? PDF_REG_API : PDF_LOC_API,
      formData,
      "cbse_data.xlsx",
    );
  } catch (error) {
    status.textContent = "❌ " + error.message;
  }
}
convertPdfBtn.onclick = () => processPDF(selectedPDFType);

/* =====================================================
   DOWNLOAD EXCEL
===================================================== */
downloadBtn.addEventListener("click", () => {
  if (!excelBlob || processing) return;
  let name = prompt("Enter file name:", downloadName);
  if (!name || !name.trim()) return;
  name = name.trim();
  if (!name.toLowerCase().endsWith(".xlsx")) name += ".xlsx";
  const url = URL.createObjectURL(excelBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* =====================================================
   THEME / PARTICLES
===================================================== */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch (_) {}
  if (icon) icon.className = theme === "light" ? "fa fa-sun" : "fa fa-moon";
  if (themeText) themeText.textContent = theme === "light" ? "Light" : "Dark";
  destroyParticles();
  if (theme !== "light") initParticles();
}
function initParticles() {
  if (
    document.documentElement.dataset.theme !== "dark" ||
    typeof particlesJS !== "function"
  )
    return;
  particlesJS("particles-js", {
    particles: {
      number: { value: 40 },
      color: { value: "#4da3ff" },
      size: { value: 2 },
      move: { speed: 0.6 },
      line_linked: { enable: false },
    },
    interactivity: { events: { onhover: { enable: true, mode: "repulse" } } },
  });
}
function destroyParticles() {
  const el = document.getElementById("particles-js");
  if (el) el.innerHTML = "";
}
let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("theme") || "dark";
} catch (_) {}
applyTheme(savedTheme);
if (toggleBtn)
  toggleBtn.addEventListener("click", () => {
    applyTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
  });
updateMode();
resetResult();
