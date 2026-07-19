const KEY='projectEldritchCharacterV1';
const fields=[...document.querySelectorAll('[data-key]')],conditions=[...document.querySelectorAll('[data-condition]')],toast=document.getElementById('toast');
const say=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500)};
const state=()=>({fields:Object.fromEntries(fields.map(e=>[e.dataset.key,e.value])),conditions:Object.fromEntries(conditions.map(e=>[e.dataset.condition,e.checked]))});
function apply(s={}){fields.forEach(e=>{if(s.fields&&e.dataset.key in s.fields)e.value=s.fields[e.dataset.key]});conditions.forEach(e=>e.checked=!!s.conditions?.[e.dataset.condition]);health();atmosphere()}
const save=(notice=false)=>{localStorage.setItem(KEY,JSON.stringify(state()));if(notice)say('Character saved.')};
const num=k=>Number(document.querySelector(`[data-key="${k}"]`)?.value||0);
function health(){const c=num('currentHealth'),m=num('maxHealth'),p=m>0?Math.max(0,Math.min(100,c/m*100)):0;document.getElementById('healthFill').style.width=p+'%';document.getElementById('healthText').textContent=`${c} / ${m} HP`}
function atmosphere(){const h=document.querySelector('[data-condition="hallucinating"]').checked,i=document.querySelector('[data-condition="insane"]').checked;document.getElementById('sheet').style.filter=h?'contrast(1.08) saturate(1.2) hue-rotate(5deg)':i?'contrast(1.12) saturate(.8)':'none'}
fields.forEach(e=>e.addEventListener('input',()=>{health();save()}));conditions.forEach(e=>e.addEventListener('change',()=>{atmosphere();save()}));
document.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>{const f=document.querySelector('[data-key="currentHealth"]'),m=num('maxHealth');let n=Number(f.value||0)+Number(b.dataset.hp);f.value=m>0?Math.max(0,Math.min(m,n)):Math.max(0,n);health();save()});
document.getElementById('rollBtn').onclick=()=>{const k=document.getElementById('rollAttribute').value,r=Math.floor(Math.random()*20)+1,mod=num(k),t=r+mod;document.getElementById('rollResult').textContent=`${k[0].toUpperCase()+k.slice(1)}: ${r} + ${mod} = ${t}${r===20?' — Natural 20!':r===1?' — Natural 1.':''}`};
document.getElementById('saveBtn').onclick=()=>save(true);
document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(document.querySelector('[data-key="name"]').value||'eldritch-character')+'.json';a.click();URL.revokeObjectURL(url);say('Character exported.')};
document.getElementById('importInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{apply(JSON.parse(await f.text()));save();say('Character imported.')}catch{alert('Invalid character file.')}e.target.value=''};
document.getElementById('resetBtn').onclick=()=>{if(!confirm('Erase this sheet and local save?'))return;localStorage.removeItem(KEY);fields.forEach(e=>e.value='');conditions.forEach(e=>e.checked=false);health();atmosphere();say('Character reset.')};
try{const raw=localStorage.getItem(KEY);if(raw)apply(JSON.parse(raw))}catch(e){console.error(e)}health();
