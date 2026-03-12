/* =====================================================
   GLOBAL STATE
===================================================== */

let cols1 = [];
let cols2 = [];

let file1Loaded = false;
let file2Loaded = false;
let compared = false;

let mergeType = "inner";

let outputFileName = "matched_export.xlsx";

const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/excel/compare-export";
//const API_URL = "http://127.0.0.1:8000/excel/compare-export";

/* =====================================================
   DOM ELEMENTS
===================================================== */

const file1 = document.getElementById("file1");
const file2 = document.getElementById("file2");

const sheet1 = document.getElementById("sheet1");
const sheet2 = document.getElementById("sheet2");

const matchCount = document.getElementById("matchCount");
const matchFields = document.getElementById("matchFields");

const exportCount = document.getElementById("exportCount");
const exportFields = document.getElementById("exportFields");

const compareBtn = document.getElementById("compareBtn");
const exportBtn = document.getElementById("exportBtn");

const status = document.getElementById("status");

const downloadBox = document.getElementById("downloadBox");
const downloadBtn = document.getElementById("downloadBtn");

const mergeSection = document.getElementById("mergeSection");

const file1Name = document.getElementById("file1Name");
const file2Name = document.getElementById("file2Name");

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

const toggleBtn = document.getElementById("theme-toggle");
const icon = toggleBtn.querySelector("i");
const text = toggleBtn.querySelector("span");

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

/* =====================================================
   MERGE BUTTONS
===================================================== */

function initMergeButtons() {
  const mergeBtns = document.querySelectorAll(".merge-btn");
  const mergeText = document.getElementById("mergeModeText");

  mergeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mergeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      mergeType = btn.dataset.type;

      mergeText.innerText = btn.innerText;
    });
  });
}

initMergeButtons();

/* =====================================================
   LOAD EXCEL
===================================================== */

function loadExcel(file, sheetSelect, colStore, doneCallback) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);

    const wb = XLSX.read(data, { type: "array" });

    sheetSelect.innerHTML = "";

    wb.SheetNames.forEach((name) => {
      sheetSelect.add(new Option(name, name));
    });

    sheetSelect.disabled = false;

    const ws = wb.Sheets[wb.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const headers = rows[0] || [];

    colStore.length = 0;

    headers.forEach((h) => {
      if (h !== undefined && h !== null && String(h).trim() !== "") {
        colStore.push(String(h).trim().toUpperCase());
      }
    });

    if (doneCallback) doneCallback();
  };

  reader.readAsArrayBuffer(file);
}

/* =====================================================
   FILE EVENTS
===================================================== */

file1.addEventListener("change", () => {
  if (!file1.files.length) return;

  let name = file1.files[0].name;

  if (name.length > 12) {
    name = name.substring(0, 12) + "...";
  }

  file1Name.textContent = name;

  loadExcel(file1.files[0], sheet1, cols1, () => {
    file1Loaded = true;
    buildOutputFileName();
    checkReady();
    renderMatchFields();
  });
});

file2.addEventListener("change", () => {
  if (!file2.files.length) return;

  let name = file2.files[0].name;

  if (name.length > 12) {
    name = name.substring(0, 12) + "...";
  }

  file2Name.textContent = name;

  loadExcel(file2.files[0], sheet2, cols2, () => {
    file2Loaded = true;
    buildOutputFileName();
    checkReady();
    renderMatchFields();
  });
});
/* =====================================================
   READY CHECK
===================================================== */

function checkReady() {
  if (file1Loaded && file2Loaded) {
    matchCount.disabled = false;
    compareBtn.disabled = false;

    mergeSection.style.display = "block";

    status.innerText = "✅ Both Excel files loaded";
  }
}

/* =====================================================
   RENDER MATCH FIELDS
===================================================== */

function renderMatchFields() {
  if (!cols1.length || !cols2.length) return;

  matchFields.innerHTML = "";

  const count = parseInt(matchCount.value || 1);

  for (let i = 0; i < count; i++) {
    const leftOptions = cols1
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    const rightOptions = cols2
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    matchFields.innerHTML += `
      <div class="match-grid">
        <select class="match-left">${leftOptions}</select>
        <select class="match-right">${rightOptions}</select>
      </div>
    `;
  }
}

matchCount.addEventListener("change", renderMatchFields);

/* =====================================================
   COMPARE
===================================================== */

compareBtn.addEventListener("click", () => {
  if (!file1Loaded || !file2Loaded) {
    status.innerText = "❌ Upload both Excel files first";
    return;
  }

  if (!sheet1.value || !sheet2.value) {
    status.innerText = "❌ Select sheets for both files";
    return;
  }

  exportCount.disabled = false;
  exportBtn.disabled = false;

  compared = true;

  status.innerText = "✅ Compare ready. Select export columns.";
});

/* =====================================================
   EXPORT FIELD SELECTION
===================================================== */

exportCount.addEventListener("change", () => {
  exportFields.innerHTML = "";

  const allCols = [
    ...cols1.map((c) => "L:" + c),
    ...cols2.map((c) => "R:" + c),
  ];

  for (let i = 0; i < exportCount.value; i++) {
    exportFields.innerHTML += `
      <select>
        ${allCols.map((c) => `<option>${c}</option>`).join("")}
      </select><br>
    `;
  }
});

/* =====================================================
   OUTPUT FILE NAME
===================================================== */

function buildOutputFileName() {
  if (!file1.files.length || !file2.files.length) return;

  const f1 = file1.files[0].name.replace(/\.(xlsx|xls)$/i, "");
  const f2 = file2.files[0].name.replace(/\.(xlsx|xls)$/i, "");

  outputFileName = `${f1}_${f2}_MATCHED.xlsx`;
}

/* =====================================================
   EXPORT
===================================================== */

exportBtn.addEventListener("click", async () => {
  if (!compared) {
    status.innerText = "❌ Please run COMPARE first";
    return;
  }

  const exportSelects = exportFields.querySelectorAll("select");

  if (!exportSelects.length) {
    status.innerText = "❌ Select export columns";
    return;
  }

  exportBtn.disabled = true;

  const oldText = exportBtn.innerHTML;

  exportBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';

  downloadBox.style.display = "none";

  const matchCols = [];

  document.querySelectorAll(".match-grid").forEach((row) => {
    const left = row.querySelector(".match-left").value;
    const right = row.querySelector(".match-right").value;

    matchCols.push([left, right]);
  });

  const exportCols = [...exportSelects].map((s) => s.value);

  const fd = new FormData();

  fd.append("file1", file1.files[0]);
  fd.append("file2", file2.files[0]);

  fd.append("sheet1", sheet1.value);
  fd.append("sheet2", sheet2.value);

  fd.append("match_cols", JSON.stringify(matchCols));
  fd.append("export_cols", JSON.stringify(exportCols));

  fd.append("merge_type", mergeType);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "X-API-Key": "your-strong-secret-key-123",
      },
      body: fd,
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || "Export failed");
    }

    const blob = await resp.blob();

    const url = URL.createObjectURL(blob);

    downloadBox.style.display = "block";

    downloadBtn.onclick = () => {
      const a = document.createElement("a");

      a.href = url;
      a.download = outputFileName;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    };

    status.innerText = "✅ Export completed. Click Download.";
  } catch (err) {
    status.innerText = "❌ " + err.message;
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = oldText;
  }
});
