/* =====================================================
   REQUIRED: XLSX must be loaded globally
===================================================== */
/*
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
*/

/* =====================================================
   GLOBAL STATE (SAME AS INLINE)
===================================================== */
let cols1 = [],
  cols2 = [];
let file1Loaded = false,
  file2Loaded = false;
let compared = false;

let outputFileName = "matched_export.xlsx";

const API_URL = "https://pdf-to-excel-api-smdv.onrender.com/excel/compare-export";

/* =====================================================
   PARTICLES (UNCHANGED)
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
   THEME TOGGLE (UNCHANGED)
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
   LOAD EXCEL + SHEETS
===================================================== */
function loadExcel(file, sheetSelect, colStore) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: "binary" });

    sheetSelect.innerHTML = "";
    wb.SheetNames.forEach((s) => sheetSelect.add(new Option(s, s)));
    sheetSelect.disabled = false;

    const ws = wb.Sheets[wb.SheetNames[0]];
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];

    colStore.splice(
      0,
      colStore.length,
      ...headers.map((h) => String(h).toUpperCase().trim()),
    );
  };
  reader.readAsBinaryString(file);
}

/* =====================================================
   FILE EVENTS (GLOBAL IDS)
===================================================== */
file1.onchange = () => {
  if (!file1.files.length) return;
  loadExcel(file1.files[0], sheet1, cols1);
  file1Loaded = true;
  buildOutputFileName();
  checkReady();
};

file2.onchange = () => {
  if (!file2.files.length) return;
  loadExcel(file2.files[0], sheet2, cols2);
  file2Loaded = true;
  buildOutputFileName();
  checkReady();
};

function checkReady() {
  if (file1Loaded && file2Loaded) {
    matchCount.disabled = false;
    compareBtn.disabled = false;
    status.innerText = "✅ Both Excel files loaded";
  }
}

/* =====================================================
   MATCH FIELDS
===================================================== */
matchCount.onchange = () => {
  matchFields.innerHTML = "";

  for (let i = 0; i < matchCount.value; i++) {
    matchFields.innerHTML += `
      <div class="match-grid">
        <select>${cols1.map((c) => `<option>${c}</option>`).join("")}</select>
        <select>${cols2.map((c) => `<option>${c}</option>`).join("")}</select>
      </div>
    `;
  }
};

/* =====================================================
   COMPARE
===================================================== */
compareBtn.onclick = () => {
  if (!file1Loaded || !file2Loaded) {
    status.innerText = "❌ Upload both Excel files first";
    return;
  }

  exportCount.disabled = false;
  exportBtn.disabled = false;
  compared = true;

  status.innerText = "✅ Compare successful. Select export columns.";
};

/* =====================================================
   EXPORT FIELDS
===================================================== */
exportCount.onchange = () => {
  exportFields.innerHTML = "";
  const all = [...cols1.map((c) => "L:" + c), ...cols2.map((c) => "R:" + c)];

  for (let i = 0; i < exportCount.value; i++) {
    exportFields.innerHTML += `
      <select>${all.map((c) => `<option>${c}</option>`).join("")}</select><br>
    `;
  }
};

/* =====================================================
   AUTO OUTPUT FILE NAME
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
exportBtn.onclick = async () => {
  if (!compared) {
    status.innerText = "❌ Please run COMPARE first";
    return;
  }

  if (!sheet1.value || !sheet2.value) {
    status.innerText = "❌ Select sheets for both Excel files";
    return;
  }

  const matchSelects = matchFields.querySelectorAll("select");
  const exportSelects = exportFields.querySelectorAll("select");

  if (!matchSelects.length || !exportSelects.length) {
    status.innerText = "❌ Select match & export columns";
    return;
  }

  exportBtn.disabled = true;
  const oldText = exportBtn.innerHTML;
  exportBtn.innerHTML = "⏳ Processing...";
  status.innerText = "⏳ Uploading & processing...";
  downloadBox.style.display = "none";

  const matchCols = [];
  for (let i = 0; i < matchSelects.length; i += 2) {
    matchCols.push([matchSelects[i].value, matchSelects[i + 1].value]);
  }

  const exportCols = [...exportSelects].map((s) => s.value);

  const fd = new FormData();
  fd.append("file1", file1.files[0]);
  fd.append("file2", file2.files[0]);
  fd.append("sheet1", sheet1.value);
  fd.append("sheet2", sheet2.value);
  fd.append("match_cols", JSON.stringify(matchCols));
  fd.append("export_cols", JSON.stringify(exportCols));

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      body: fd,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err || "Export failed");
    }

    const blob = await resp.blob();
    const downloadUrl = URL.createObjectURL(blob);

    downloadBox.style.display = "block";

    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = outputFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    };

    status.innerText = "✅ Export completed. Click Download to save Excel.";
  } catch (err) {
    status.innerText = "❌ " + err.message;
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = oldText;
  }
};
