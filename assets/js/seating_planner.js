
// Empty uses the local Python app. For hosting, set your deployed HTTPS API URL.
// Never put API secrets in this public file. See README_PORTFOLIO.md.
const API_BASE_URL = "https://pdf-to-excel-api-smdv.onrender.com";
let token;
async function connect() {
    if (!token) {
        const response = await fetch(
            API_BASE_URL + '/seating/session'
        );

        if (!response.ok) {
            throw Error(
                'Cannot connect to the planner backend.'
            );
        }

        const session = await response.json();

        token = session.token;

        if (!token) {
            throw Error(
                'The backend returned an invalid session.'
            );
        }
    }
}
const el=id=>document.getElementById(id);let loaded=false;
function report(message,error=false){el('report').textContent=message;el('report').className=error?'error':'good'}
async function api(route, payload) {
    await connect();

    const response = await fetch(
        API_BASE_URL + route,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Planner-Token': token
            },
            body: JSON.stringify(payload)
        }
    );

    if (!response.ok) {
        const error = await response.json();
    
        throw Error(
            error.detail ||
            error.error ||
            'Planner request failed.'
        );
    }

    return response;
}
function addRow(a={room:'',side:'Left',section:'',start:1,end:20}){const tr=document.createElement('tr');for(const key of ['room','side','section','start','end']){const td=document.createElement('td');let input;if(key==='side'){input=document.createElement('select');for(const side of ['Left','Right']){const o=document.createElement('option');o.textContent=side;input.append(o)}}else{input=document.createElement('input');input.type=['start','end'].includes(key)?'number':'text';if(input.type==='number')input.min=1}input.value=a[key];input.dataset.key=key;td.append(input);tr.append(td)}const td=document.createElement('td'),b=document.createElement('button');b.textContent='Remove';b.onclick=()=>tr.remove();td.append(b);tr.append(td);el('rows').append(tr)}
function payload(){if(!loaded)throw Error('Load the input files first.');return {grades:[...el('grades').querySelectorAll('input:checked')].map(x=>x.value),allocations:[...el('rows').children].map(tr=>Object.fromEntries([...tr.querySelectorAll('input,select')].map(i=>[i.dataset.key,i.value]))),school:el('school').value}}
function fileData(id){return new Promise((resolve,reject)=>{const file=el(id).files[0];if(!file)return reject(Error('Choose all three workbooks.'));if(file.size>20*1024*1024)return reject(Error('Each workbook must be smaller than 20 MB.'));const reader=new FileReader();reader.onerror=()=>reject(Error('Cannot read '+file.name));reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(file)})}
async function run(action){for(const b of document.querySelectorAll('.actions button'))b.disabled=true;try{await action()}catch(e){report(e.message,true)}finally{for(const b of document.querySelectorAll('.actions button'))b.disabled=false}}
async function check(){const data=await (await api('/seating/validate',payload())).json();el('status').textContent=`${data.total} loaded · ${data.selected} selected · ${data.excluded} excluded · ${data.rooms} rooms`;report((data.errors.length?data.errors.join('\n'):'Every selected student is assigned exactly once. Ready to export.')+(data.adjustments.length?'\n\nAutomatic adjustments on load:\n'+data.adjustments.join('\n'):''),!!data.errors.length);return data.errors.length===0}
el('load').onclick=()=>run(async()=>{const files=await Promise.all(['subjects','students','arrangement'].map(fileData));const data=await (await api('/seating/load',{files})).json();loaded=true;el('grades').replaceChildren();for(const g of data.grades){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=g;input.checked=true;label.append(input,document.createTextNode('Grade '+g));el('grades').append(label)}el('rows').replaceChildren();data.allocations.forEach(addRow);await check()});
el('add').onclick=()=>{if(loaded)addRow();else report('Load the files first.',true)};
el('validate').onclick=()=>run(check);
el('export').onclick=()=>run(async()=>{if(!await check())return;const r=await api('/seating/export',payload());const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='Exam_Reports.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);report('Download prepared: Attendance_Sheet.xlsx (five grade-group tabs) and Seating_Plan.xlsx inside Exam_Reports.zip.');});

for(const id of ['subjects','students','arrangement']){
 document.getElementById(id).addEventListener('change',()=>{
  const file=document.getElementById(id).files[0];
  document.getElementById(id+'-name').textContent=file?file.name:'No file selected';
 });
}
for(const label of document.querySelectorAll('.file-btn')){
 label.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById(label.htmlFor).click();}
 });
}

function applyTheme(theme) {
 document.documentElement.dataset.theme=theme;
 document.documentElement.classList.toggle('light',theme==='light');
 el('theme-text').textContent=theme==='light'?'Light':'Dark';
 el('theme-icon').textContent=theme==='light'?'☀':'☾';
 el('theme-toggle').setAttribute('aria-label',theme==='light'?'Switch to dark theme':'Switch to light theme');
 try { localStorage.setItem('theme',theme); } catch {}
}
let theme=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
try { theme=localStorage.getItem('theme') || theme; } catch {}
applyTheme(theme==='light'?'light':'dark');
el('theme-toggle').addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
el('year').textContent=new Date().getFullYear();
