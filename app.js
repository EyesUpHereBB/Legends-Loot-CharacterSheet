const KEY='projectEldritchCharacterV3';
const LEGACY_KEYS=['projectEldritchCharacterV2','projectEldritchCharacterV1'];
const fields=[...document.querySelectorAll('[data-key]')];
const conditions=[...document.querySelectorAll('[data-condition]')];
const toast=document.getElementById('toast');
const SOUND_KEY='projectEldritchSoundEnabled';
let soundEnabled=localStorage.getItem(SOUND_KEY)!=='false';
const say=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500)};

const defaultTools={
  notebook:{activeTab:'notes',collapsed:false,x:900,y:405,w:410,h:455,tabNames:{notes:'Notes',quests:'Quests',npcs:'NPCs',locations:'Locations',lore:'Lore',important:'Important'},tabs:{notes:'',quests:'',npcs:'',locations:'',lore:'',important:''}},
  backpack:{activeTab:'weapons',collapsed:false,x:1190,y:445,w:285,h:390,tabNames:{weapons:'Weapons',armor:'Armor',consumables:'Consumables',questItems:'Quest Items',valuables:'Valuables',misc:'Misc.'},tabs:{weapons:[],armor:[],consumables:[],questItems:[],valuables:[],misc:[]}},
  coin:{collapsed:true,x:1030,y:690,w:330,h:500,balances:{gp:0,sp:0,cp:0},history:[],historyCollapsed:false},
  characterBook:{collapsed:true,x:760,y:705,w:720,h:650,activeTab:'overview',openSections:['overview','attributes'],quips:[],quipHistoryCollapsed:false,equipment:{mainHand:'',offHand:'',head:'',body:'',hands:'',feet:'',trinket1:'',trinket2:'',trinket3:'',ability1:'',ability2:'',ability3:''}}
};
const cloneDefaults=()=>JSON.parse(JSON.stringify(defaultTools));
let tools=cloneDefaults();
const state=()=>({fields:Object.fromEntries(fields.map(e=>[e.dataset.key,e.value])),conditions:Object.fromEntries(conditions.map(e=>[e.dataset.condition,e.checked])),tools});

function escapeHtml(v){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function entriesToHtml(entries=[]){
  return entries.map(e=>`<h2>${escapeHtml(e.name||'Untitled')}</h2><div>${escapeHtml(e.detail||'').replace(/\n/g,'<br>')}</div>`).join('<div><br></div>');
}
function mergeTools(saved){
  const base=cloneDefaults();
  if(!saved)return base;
  const oldNotebook=saved.notebook||{};
  base.notebook={...base.notebook,...oldNotebook,tabs:{...base.notebook.tabs},tabNames:{...base.notebook.tabNames,...(oldNotebook.tabNames||{})}};
  for(const [tab,val] of Object.entries(oldNotebook.tabs||{})){
    base.notebook.tabs[tab]=Array.isArray(val)?entriesToHtml(val):(typeof val==='string'?val:'');
    if(!base.notebook.tabNames[tab])base.notebook.tabNames[tab]=humanizeTab(tab);
  }
  const oldBackpack=saved.backpack||{};
  base.backpack={...base.backpack,...oldBackpack,tabs:{...base.backpack.tabs},tabNames:{...base.backpack.tabNames,...(oldBackpack.tabNames||{})}};
  const aliases={items:'misc'};
  for(const [tab,val] of Object.entries(oldBackpack.tabs||{})){
    const target=aliases[tab]||tab;
    if(Array.isArray(val)){
      base.backpack.tabs[target]=val;
      if(!base.backpack.tabNames[target])base.backpack.tabNames[target]=humanizeTab(target);
    }
  }
  if(!(base.notebook.activeTab in base.notebook.tabs))base.notebook.activeTab=Object.keys(base.notebook.tabs)[0];
  if(!(base.backpack.activeTab in base.backpack.tabs))base.backpack.activeTab=Object.keys(base.backpack.tabs)[0];
  const oldBook=saved.characterBook||{};
  base.characterBook={...base.characterBook,...oldBook,quips:Array.isArray(oldBook.quips)?oldBook.quips:[],equipment:{...base.characterBook.equipment,...(oldBook.equipment||{})}};
  if(!Array.isArray(base.characterBook.openSections)){base.characterBook.openSections=[base.characterBook.activeTab||'overview']}
  base.characterBook.openSections=[...new Set(base.characterBook.openSections)].filter(k=>['overview','attributes','combat','resistances','conditions','biography','equipment','quips'].includes(k));
  if(!base.characterBook.openSections.length)base.characterBook.openSections=['overview'];
  const oldCoin=saved.coin||{};
  base.coin={...base.coin,...oldCoin,balances:{...base.coin.balances,...(oldCoin.balances||{})},history:Array.isArray(oldCoin.history)?oldCoin.history:[]};
  for(const type of ['gp','sp','cp'])base.coin.balances[type]=Math.max(0,Math.floor(Number(base.coin.balances[type])||0));
  return base;
}
function apply(s={}){
  fields.forEach(e=>{if(s.fields&&e.dataset.key in s.fields)e.value=s.fields[e.dataset.key]});
  conditions.forEach(e=>e.checked=!!s.conditions?.[e.dataset.condition]);
  tools=mergeTools(s.tools);
  renderAllTools();health();atmosphere();
}
const save=(notice=false)=>{localStorage.setItem(KEY,JSON.stringify(state()));if(notice)say('Character saved.')};
const num=k=>Number(document.querySelector(`[data-key="${k}"]`)?.value||0);
function health(){
  const c=Math.max(0,num('currentHealth')),m=Math.max(0,num('maxHealth')),t=Math.max(0,num('tempHealth'));
  const normal=Math.min(c,m||c),totalCapacity=Math.max(1,m+t);
  const normalWidth=Math.max(0,Math.min(100,(normal/totalCapacity)*100));
  const tempWidth=Math.max(0,Math.min(100-normalWidth,(t/totalCapacity)*100));
  document.getElementById('healthFill').style.width=normalWidth+'%';
  document.getElementById('tempHealthFill').style.width=tempWidth+'%';
  document.getElementById('healthText').textContent=t>0?`${c} / ${m} HP • ${t} Temp`:`${c} / ${m} HP`;
}
function atmosphere(){const sheet=document.getElementById('sheet');if(sheet)sheet.style.filter='none'}

function humanizeTab(key){return String(key).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function uniqueTabKey(tool,label){
  const base=(label||'tab').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'tab';
  let key=base,n=2;while(key in tool.tabs)key=`${base}-${n++}`;return key;
}
function tabMarkup(data){
  return Object.keys(data.tabs).map(key=>`<div class="tab-chip${key===data.activeTab?' active':''}" data-tab-chip="${escapeHtml(key)}">
    <button type="button" class="tab-select" data-tab="${escapeHtml(key)}" title="Open ${escapeHtml(data.tabNames[key]||humanizeTab(key))}">${escapeHtml(data.tabNames[key]||humanizeTab(key))}</button>
    <button type="button" class="tab-edit" data-rename-tab="${escapeHtml(key)}" aria-label="Rename tab" title="Rename tab">✎</button>
    <button type="button" class="tab-delete" data-delete-tab="${escapeHtml(key)}" aria-label="Delete tab" title="Delete tab">×</button>
  </div>`).join('');
}
function renderTabBar(el,data){el.querySelector('[data-tabs-list]').innerHTML=tabMarkup(data)}
function addTab(toolName){
  const data=tools[toolName],label=prompt('Name the new tab:');if(!label||!label.trim())return;
  const key=uniqueTabKey(data,label);data.tabNames[key]=label.trim();data.tabs[key]=toolName==='notebook'?'':[];data.activeTab=key;
  renderAllTools();save();
}
function renameTab(toolName,key){
  const data=tools[toolName],current=data.tabNames[key]||humanizeTab(key),label=prompt('Rename tab:',current);
  if(!label||!label.trim())return;data.tabNames[key]=label.trim();renderAllTools();save();
}
function deleteTab(toolName,key){
  const data=tools[toolName],keys=Object.keys(data.tabs);if(keys.length<=1){alert('Keep at least one tab.');return}
  const label=data.tabNames[key]||humanizeTab(key);if(!confirm(`Delete the “${label}” tab and everything inside it?`))return;
  delete data.tabs[key];delete data.tabNames[key];if(data.activeTab===key)data.activeTab=Object.keys(data.tabs)[0];renderAllTools();save();
}
function bindTabManagement(el,toolName,beforeSwitch){
  el.querySelector('[data-add-tab]').addEventListener('click',()=>addTab(toolName));
  el.querySelector('[data-tabs-list]').addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]')?.dataset.tab;
    const rename=e.target.closest('[data-rename-tab]')?.dataset.renameTab;
    const remove=e.target.closest('[data-delete-tab]')?.dataset.deleteTab;
    if(tab){beforeSwitch?.();tools[toolName].activeTab=tab;if(toolName==='backpack')el.querySelector('[data-tool-search]').value='';toolName==='notebook'?renderNotebook():renderBackpack();save()}
    else if(rename)renameTab(toolName,rename);else if(remove)deleteTab(toolName,remove);
  });
}

function entryTemplate(entry,index){
  return `<div class="tool-entry" data-entry-index="${index}">
    <input class="entry-name" aria-label="Item name" placeholder="Item name" value="${escapeHtml(entry.name||'')}">
    <input class="entry-qty" aria-label="Quantity" placeholder="Qty" value="${escapeHtml(entry.qty||'')}">
    <button type="button" data-delete-entry aria-label="Delete item">×</button>
    <textarea class="entry-detail" aria-label="Details" placeholder="Details, weight, rarity, damage…">${escapeHtml(entry.detail||'')}</textarea>
  </div>`;
}

function sourceField(key){return document.querySelector(`[data-key="${key}"]`)}
function setSourceField(key,value){const src=sourceField(key);if(!src)return;src.value=value;src.dispatchEvent(new Event('input',{bubbles:true}))}
const STATUS_VISUALS={
  unconscious:{label:'Unconscious',symbol:'💀'}, bleeding:{label:'Bleeding',symbol:'🩸'}, infected:{label:'Infected',symbol:'☣'}, poisoned:{label:'Poisoned',symbol:'☠'},
  insane:{label:'Insane',symbol:'🌀'}, hallucinating:{label:'Hallucinating',symbol:'👁'}, frightened:{label:'Frightened',symbol:'⚠'}, broken:{label:'Broken',symbol:'🦴'},
  restrained:{label:'Restrained',symbol:'⛓'}, silenced:{label:'Silenced',symbol:'🔇'}, exhausted:{label:'Exhausted',symbol:'🪫'}
};
const STATUS_PRIORITY=['unconscious','bleeding','infected','poisoned','insane','hallucinating','frightened','broken','restrained','silenced','exhausted'];
let statusAudioContext=null;
function getStatusAudioContext(){
  if(!soundEnabled)return null;
  if(!statusAudioContext){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return null;
    statusAudioContext=new AudioContextClass();
  }
  if(statusAudioContext.state==='suspended')statusAudioContext.resume().catch(()=>{});
  return statusAudioContext;
}
const STATUS_SOUND_PROFILES={
  unconscious:[92,68],bleeding:[170,110],infected:[245,185],poisoned:[310,220],insane:[430,615],hallucinating:[520,780],frightened:[240,360],broken:[155,95],restrained:[205,165],silenced:[330,250],exhausted:[125,105]
};
function playStatusSound(key,enabled=true){
  const ctx=getStatusAudioContext();if(!ctx)return;
  const now=ctx.currentTime,profile=STATUS_SOUND_PROFILES[key]||[280,220];
  const master=ctx.createGain();master.gain.setValueAtTime(0.0001,now);master.gain.exponentialRampToValueAtTime(enabled?0.13:0.075,now+0.015);master.gain.exponentialRampToValueAtTime(0.0001,now+(enabled?0.42:0.25));master.connect(ctx.destination);
  profile.forEach((frequency,index)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=key==='hallucinating'||key==='insane'?'triangle':key==='bleeding'?'sawtooth':'sine';
    const start=now+index*0.055;
    osc.frequency.setValueAtTime(enabled?frequency:frequency*0.8,start);
    if(enabled&&['frightened','insane','hallucinating'].includes(key))osc.frequency.exponentialRampToValueAtTime(frequency*1.22,start+0.18);
    gain.gain.setValueAtTime(index?0.42:0.7,start);gain.gain.exponentialRampToValueAtTime(0.0001,start+(enabled?0.34:0.18));
    osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+(enabled?0.38:0.22));
  });
}
function playResetStatusSound(){
  const ctx=getStatusAudioContext();if(!ctx)return;
  [420,330,250].forEach((frequency,index)=>{
    const now=ctx.currentTime+index*0.075,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,now);gain.gain.setValueAtTime(0.08,now);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.22);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+0.24);
  });
}

function playHealthChangeSound(kind,amount=1){
  const ctx=getStatusAudioContext();if(!ctx)return;
  const now=ctx.currentTime;
  const master=ctx.createGain();
  const peak=Math.min(0.16,0.075+Math.abs(amount)*0.006);
  master.gain.setValueAtTime(0.0001,now);
  master.gain.exponentialRampToValueAtTime(peak,now+0.012);
  master.gain.exponentialRampToValueAtTime(0.0001,now+0.42);
  master.connect(ctx.destination);
  const notes=kind==='gain'?[392,523,659]:kind==='temp'?[330,440,587]:[196,147,110];
  notes.forEach((frequency,index)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    const start=now+index*0.055;
    osc.type=kind==='loss'?'sawtooth':kind==='temp'?'triangle':'sine';
    osc.frequency.setValueAtTime(frequency,start);
    if(kind==='loss')osc.frequency.exponentialRampToValueAtTime(Math.max(70,frequency*.72),start+.22);
    else osc.frequency.exponentialRampToValueAtTime(frequency*1.08,start+.18);
    gain.gain.setValueAtTime(index===0?.7:.42,start);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+.28);
    osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+.31);
  });
}


function playFullRestorationSound(){
  const ctx=getStatusAudioContext();if(!ctx)return;
  const now=ctx.currentTime,master=ctx.createGain();
  master.gain.setValueAtTime(0.0001,now);master.gain.exponentialRampToValueAtTime(0.15,now+0.02);master.gain.exponentialRampToValueAtTime(0.0001,now+1.15);master.connect(ctx.destination);
  [261.63,329.63,392,523.25,659.25].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),start=now+i*.11;o.type=i<3?'sine':'triangle';o.frequency.setValueAtTime(f,start);g.gain.setValueAtTime(i===4?.7:.48,start);g.gain.exponentialRampToValueAtTime(.0001,start+.55);o.connect(g);g.connect(master);o.start(start);o.stop(start+.58)});
}
function playDeathSound(){
  const ctx=getStatusAudioContext();if(!ctx)return;
  const now=ctx.currentTime,master=ctx.createGain();master.gain.setValueAtTime(.15,now);master.gain.exponentialRampToValueAtTime(.0001,now+1.25);master.connect(ctx.destination);
  [146.83,110,73.42].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),start=now+i*.16;o.type=i===0?'sawtooth':'triangle';o.frequency.setValueAtTime(f,start);o.frequency.exponentialRampToValueAtTime(Math.max(42,f*.55),start+.62);g.gain.setValueAtTime(i===0?.7:.52,start);g.gain.exponentialRampToValueAtTime(.0001,start+.82);o.connect(g);g.connect(master);o.start(start);o.stop(start+.85)});
}
function updateSoundToggle(){
  const button=document.getElementById('soundToggle');if(!button)return;
  button.setAttribute('aria-pressed',String(soundEnabled));button.title=soundEnabled?'Turn sound off':'Turn sound on';
  button.querySelector('[aria-hidden]').textContent=soundEnabled?'🔊':'🔇';button.querySelector('.sound-toggle-label').textContent=soundEnabled?'Sound on':'Sound off';
  button.classList.toggle('muted',!soundEnabled);
}

let previousBookHealth=null,previousBookTemp=null,healthAnimationTimer=null;
function activeConditionNames(){return conditions.filter(box=>box.checked).map(box=>box.dataset.condition)}
function syncInfectionConditionFromLevel({silent=false}={}){
  const field=sourceField('infectionLevel');
  const box=document.querySelector('[data-condition="infected"]');
  if(!field||!box)return false;
  const level=Math.max(0,Number(field.value||0));
  const shouldBeActive=level>0;
  if(box.checked===shouldBeActive)return false;
  box.checked=shouldBeActive;
  if(!silent)playStatusSound('infected',shouldBeActive);
  return true;
}
function primaryStatus(active,current){if(current<=0)return {key:'unconscious',...STATUS_VISUALS.unconscious};const key=STATUS_PRIORITY.find(k=>active.includes(k));return key?{key,...STATUS_VISUALS[key]}:{key:'none',label:'Stable',symbol:'♥'}}
function animateHealthOrbit(orbit,current,temp){
  if(previousBookHealth===null){previousBookHealth=current;previousBookTemp=temp;return}
  orbit.classList.remove('hp-damaged','hp-healed','hp-temp');void orbit.offsetWidth;
  const max=Math.max(0,num('maxHealth'));
  if(current<=0&&previousBookHealth>0){orbit.classList.add('hp-damaged');playDeathSound()}
  else if(max>0&&current>=max&&previousBookHealth<max){orbit.classList.add('hp-healed');playFullRestorationSound()}
  else if(current<previousBookHealth){orbit.classList.add('hp-damaged');playHealthChangeSound('loss',previousBookHealth-current)}
  else if(current>previousBookHealth){orbit.classList.add('hp-healed');playHealthChangeSound('gain',current-previousBookHealth)}
  else if(temp!==previousBookTemp){orbit.classList.add('hp-temp');playHealthChangeSound('temp',temp-previousBookTemp)}
  clearTimeout(healthAnimationTimer);healthAnimationTimer=setTimeout(()=>orbit.classList.remove('hp-damaged','hp-healed','hp-temp'),650);
  previousBookHealth=current;previousBookTemp=temp;
}

function renderCharacterBook(){
  const el=document.getElementById('characterBookTool');if(!el)return;const data=tools.characterBook;
  el.style.left=data.x+'px';el.style.top=data.y+'px';el.classList.toggle('collapsed',data.collapsed);
  if(data.collapsed){el.style.width='';el.style.height=''}else{el.style.width=(data.w||906)+'px';el.style.height=(data.h||650)+'px'}
  const openSections=Array.isArray(data.openSections)?data.openSections:['overview'];
  el.querySelectorAll('[data-book-tab]').forEach(b=>{const open=openSections.includes(b.dataset.bookTab);b.classList.toggle('active',open);b.setAttribute('aria-pressed',String(open))});
  el.querySelectorAll('[data-book-page]').forEach(page=>{const open=openSections.includes(page.dataset.bookPage);page.classList.toggle('expanded',open);const content=page.querySelector('.book-section-content'),toggle=page.querySelector('[data-book-section-toggle]'),chevron=page.querySelector('.book-chevron');if(content)content.hidden=!open;if(toggle)toggle.setAttribute('aria-expanded',String(open));if(chevron)chevron.textContent=open?'⌄':'›'});
  el.querySelectorAll('[data-book-field]').forEach(input=>{const src=sourceField(input.dataset.bookField);if(src&&document.activeElement!==input)input.value=src.value});
  el.querySelectorAll('[data-book-read]').forEach(node=>node.textContent=sourceField(node.dataset.bookRead)?.value||'0');
  const c=Math.max(0,num('currentHealth')),m=Math.max(0,num('maxHealth')),t=Math.max(0,num('tempHealth'));
  const displayPct=m>0?Math.round((Math.min(c,m)/m)*100):0;
  el.querySelector('[data-book-health]').textContent=`${c} / ${m}`;
  el.querySelector('[data-book-temp]').textContent=t?`${t} temporary HP active`:'No temporary HP';
  el.querySelector('[data-book-health-percent]').textContent=`${displayPct}%`;
  const orbit=el.querySelector('[data-book-health-bar]');
  const healthRing=el.querySelector('[data-health-ring-value]'),tempRing=el.querySelector('[data-health-ring-temp]');
  const healthCirc=433.54,tempCirc=383.27;
  healthRing.style.strokeDashoffset=String(healthCirc*(1-Math.max(0,Math.min(1,m?c/m:0))));
  tempRing.style.strokeDashoffset=String(tempCirc*(1-Math.max(0,Math.min(1,m?t/m:0))));
  orbit.setAttribute('aria-valuemax',String(Math.max(0,m)));orbit.setAttribute('aria-valuenow',String(Math.min(c,Math.max(0,m))));orbit.setAttribute('aria-valuetext',t?`${c} of ${m} hit points plus ${t} temporary hit points`:`${c} of ${m} hit points`);
  orbit.classList.remove('health-good','health-wounded','health-critical','health-down');
  orbit.classList.add(c<=0?'health-down':displayPct<=25?'health-critical':displayPct<=60?'health-wounded':'health-good');
  const infectionLevel=Math.max(0,Math.min(10,Math.floor(num('infectionLevel'))));
  [...orbit.classList].filter(k=>k.startsWith('infection-level-')).forEach(k=>orbit.classList.remove(k));
  orbit.classList.add(`infection-level-${infectionLevel}`);
  orbit.style.setProperty('--infection-level',String(infectionLevel));
  orbit.setAttribute('data-infection-stage',infectionLevel===0?'clear':infectionLevel<=2?'trace':infectionLevel<=4?'spreading':infectionLevel<=6?'systemic':infectionLevel<=8?'severe':'critical');
  const healthPanel=el.querySelector('.redesigned-health');
  if(healthPanel){[...healthPanel.classList].filter(k=>k.startsWith('bio-stage-')).forEach(k=>healthPanel.classList.remove(k));healthPanel.classList.toggle('bio-infected',infectionLevel>0);healthPanel.classList.add(`bio-stage-${infectionLevel}`);healthPanel.style.setProperty('--bio-level',String(infectionLevel));}
  const active=activeConditionNames();
  const displayedActive=c<=0?[...new Set(['unconscious',...active])]:active;
  const status=primaryStatus(displayedActive,c);
  [...orbit.classList].filter(k=>k.startsWith('status-')).forEach(k=>orbit.classList.remove(k));orbit.classList.add(`status-${status.key}`);
  el.querySelector('[data-status-symbol]').textContent=status.symbol;el.querySelector('[data-status-name]').textContent=status.label;
  const chips=el.querySelector('[data-active-statuses]');
  chips.innerHTML=displayedActive.length?displayedActive.map(key=>`<span class="active-status-chip ${key===status.key?'primary':''}">${STATUS_VISUALS[key]?.symbol||'•'} ${escapeHtml(STATUS_VISUALS[key]?.label||humanizeTab(key))}</span>`).join(''):'<span class="active-status-chip primary">♥ Stable</span>';
  const orbitBadges=el.querySelector('[data-status-orbit-badges]');
  orbitBadges.innerHTML=displayedActive.map((key,index)=>{const visual=STATUS_VISUALS[key]||{symbol:'•',label:humanizeTab(key)};return `<span class="status-orbit-badge status-orbit-${escapeHtml(key)} ${key===status.key?'primary':''}" style="--status-index:${index};--status-count:${Math.max(displayedActive.length,1)}" title="${escapeHtml(visual.label)}" aria-label="${escapeHtml(visual.label)}">${visual.symbol}</span>`}).join('');
  orbitBadges.classList.toggle('many-statuses',displayedActive.length>6);
  animateHealthOrbit(orbit,c,t);
  el.querySelectorAll('[data-equipment-slot]').forEach(input=>{const key=input.dataset.equipmentSlot;if(document.activeElement!==input)input.value=data.equipment?.[key]||''});
  const backpackOptions=el.querySelector('#backpack-item-options');
  if(backpackOptions){const names=[...new Set(Object.values(tools.backpack.tabs||{}).flat().map(item=>String(item?.name||'').trim()).filter(Boolean))];backpackOptions.innerHTML=names.map(name=>`<option value="${escapeHtml(name)}"></option>`).join('')}
  const other=sourceField('otherResistLabel')?.value||'Other';el.querySelector('[data-book-other-label]').textContent=other;
  const conditionHost=el.querySelector('[data-book-conditions]');
  conditionHost.innerHTML=conditions.map(box=>{const key=box.dataset.condition;const visual=STATUS_VISUALS[key];return `<label class="book-condition"><input type="checkbox" data-book-condition="${escapeHtml(key)}" ${box.checked?'checked':''}><span>${visual?.symbol||'•'} ${humanizeTab(key)}</span></label>`}).join('');
  const inspiration=Math.max(0,Math.min(6,Math.floor(num('inspirationPoints'))));
  const starHost=el.querySelector('[data-inspiration-stars]');
  if(starHost)starHost.innerHTML=Array.from({length:6},(_,i)=>`<button type="button" data-set-inspiration="${i+1}" class="${i<inspiration?'active':''}" aria-label="Set inspiration to ${i+1}" aria-pressed="${i<inspiration}">★</button>`).join('')+`<button type="button" class="clear-inspiration" data-set-inspiration="0" aria-label="Clear inspiration">Reset</button>`;
  const quipHistory=el.querySelector('[data-quip-history]');
  if(quipHistory){
    const list=tools.characterBook.quips||[];
    quipHistory.innerHTML=list.length?list.map(q=>`<div class="quip-history-item"><span>“${escapeHtml(q.text)}”</span><time>${escapeHtml(q.time||'')}</time></div>`).join(''):'<p>No quips generated yet.</p>';
    quipHistory.hidden=!!tools.characterBook.quipHistoryCollapsed;
    const toggle=el.querySelector('[data-toggle-quip-history]');
    if(toggle){toggle.setAttribute('aria-expanded',String(!tools.characterBook.quipHistoryCollapsed));const ch=toggle.querySelector('.history-chevron');if(ch)ch.textContent=tools.characterBook.quipHistoryCollapsed?'›':'⌄'}
  }
}
function quipSourceText(){return ['occupation','origin','appearance','notes','journal','background'].map(k=>sourceField(k)?.value||'').join(' ').trim()}
function generateCharacterQuip(promptText=''){
  const name=(sourceField('name')?.value||'I').trim();
  const occupation=(sourceField('occupation')?.value||'wanderer').trim();
  const origin=(sourceField('origin')?.value||'the road behind me').trim();
  const source=quipSourceText().toLowerCase();
  const prompt=promptText.trim();
  const dark=/eldritch|horror|death|blood|curse|ruin|deep|sunken|ghost|monster|mad|fear/.test(source);
  const loyal=/friend|family|protect|loyal|bond|oath|save/.test(source);
  const clever=/clever|plan|trick|rogue|spy|scholar|investigat|secret/.test(source);
  const templates=[];
  if(dark)templates.push(`“The dark has teeth. Good thing I learned to bite back.”`,`“I have seen worse things than this—and some of them still remember my name.”`,`“Whatever waits below, it will learn that ${name} does not scare easily.”`);
  if(loyal)templates.push(`“No one under my protection gets left behind.”`,`“I can lose the trail, the treasure, even the fight—but not my people.”`);
  if(clever)templates.push(`“Every locked door is just a question with an impatient answer.”`,`“Give me a moment. There is always another angle.”`,`“A ${occupation} survives by noticing what everyone else ignores.”`);
  templates.push(`“I did not come all the way from ${origin} to turn back now.”`,`“Call it courage if you like. I call it refusing to die today.”`,`“Let us finish this before the story gets any uglier.”`,`“I have a bad feeling about this—which usually means I am paying attention.”`);
  if(prompt)templates.push(`“${prompt.replace(/[.!?]+$/,'')}? Then let us make it memorable.”`,`“For ${prompt.replace(/[.!?]+$/,'').toLowerCase()}, I have exactly one plan: survive first, explain later.”`);
  return templates[Math.floor(Math.random()*templates.length)];
}
function applyHealthChange(change){
  const currentField=sourceField('currentHealth'),tempField=sourceField('tempHealth'),max=num('maxHealth');let current=Math.max(0,Number(currentField.value||0)),temp=Math.max(0,Number(tempField.value||0));
  if(change<0){let damage=Math.abs(change),absorbed=Math.min(temp,damage);temp-=absorbed;damage-=absorbed;current=Math.max(0,current-damage)}else current=max>0?Math.min(max,current+change):current+change;
  currentField.value=current;tempField.value=temp;health();renderCharacterBook();save();
}

function renderNotebook(){
  const el=document.getElementById('notebookTool'),data=tools.notebook;
  el.style.left=data.x+'px';el.style.top=data.y+'px';el.classList.toggle('collapsed',data.collapsed);
  if(data.collapsed){el.style.width='';el.style.height=''}else{el.style.width=(data.w||410)+'px';el.style.height=(data.h||455)+'px'}
  renderTabBar(el,data);
  el.querySelector('[data-note-editor]').innerHTML=data.tabs[data.activeTab]||'';
  el.querySelector('[data-note-search]').value='';
  el.querySelector('[data-note-search-status]').textContent='';
}
function renderBackpack(){
  const el=document.getElementById('backpackTool'),data=tools.backpack;
  el.style.left=data.x+'px';el.style.top=data.y+'px';el.classList.toggle('collapsed',data.collapsed);
  if(data.collapsed){el.style.width='';el.style.height=''}else{el.style.width=(data.w||285)+'px';el.style.height=(data.h||390)+'px'}
  renderTabBar(el,data);
  const q=el.querySelector('[data-tool-search]').value.trim().toLowerCase();
  const entries=data.tabs[data.activeTab]||[];
  const filtered=entries.map((entry,index)=>({entry,index})).filter(({entry})=>!q||`${entry.name||''} ${entry.detail||''} ${entry.qty||''}`.toLowerCase().includes(q));
  el.querySelector('[data-tool-list]').innerHTML=filtered.length?filtered.map(({entry,index})=>entryTemplate(entry,index)).join(''):'<div class="tool-empty">No matching items.</div>';
}
function formatCoinNumber(value){return Math.max(0,Number(value)||0).toLocaleString()}
function renderCoin(){
  const el=document.getElementById('coinTool'),data=tools.coin;
  el.style.left=data.x+'px';el.style.top=data.y+'px';el.classList.toggle('collapsed',data.collapsed);
  if(data.collapsed){el.style.width='';el.style.height=''}else{el.style.width=(data.w||330)+'px';el.style.height=(data.h||500)+'px'}
  for(const type of ['gp','sp','cp'])el.querySelector(`[data-coin-balance="${type}"]`).textContent=formatCoinNumber(data.balances[type]);
  const total=(data.balances.gp||0)+(data.balances.sp||0)/10+(data.balances.cp||0)/100;
  el.querySelector('[data-coin-total]').textContent=`${total.toLocaleString(undefined,{maximumFractionDigits:2})} gp`;
  const history=el.querySelector('[data-coin-history]');
  history.innerHTML=data.history.length?data.history.map(item=>{
    const sign=item.delta>0?'+':'';
    const date=new Date(item.time);
    const stamp=Number.isNaN(date.getTime())?'':date.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    return `<div class="coin-history-row ${item.delta>=0?'positive':'negative'}"><span class="coin-delta">${sign}${item.delta} ${escapeHtml(item.type)}</span><span class="coin-reason">${escapeHtml(item.note||'Quick adjustment')}</span><time>${escapeHtml(stamp)}</time><span class="coin-after">Balance after: ${formatCoinNumber(item.after)} ${escapeHtml(item.type)}</span></div>`;
  }).join(''):'<div class="coin-history-empty">No coin changes yet.</div>';
  history.hidden=!!data.historyCollapsed;
  const historyToggle=el.querySelector('[data-toggle-coin-history]');
  if(historyToggle){
    historyToggle.setAttribute('aria-expanded',String(!data.historyCollapsed));
    const ch=historyToggle.querySelector('.history-chevron');
    if(ch)ch.textContent=data.historyCollapsed?'›':'⌄';
    const label=historyToggle.querySelector('strong');
    if(label)label.textContent=data.historyCollapsed?'Expand History':'Collapse History';
  }
}
function renderAllTools(){renderNotebook();renderBackpack();renderCoin();renderCharacterBook()}

function enableDrag(el,name){
  const handle=el.querySelector('[data-drag-handle]');let drag=null;
  handle.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={dx:e.clientX-el.offsetLeft,dy:e.clientY-el.offsetTop};handle.setPointerCapture(e.pointerId)});
  handle.addEventListener('pointermove',e=>{if(!drag)return;const maxX=1536-el.offsetWidth,maxY=1024-el.offsetHeight;tools[name].x=Math.max(0,Math.min(maxX,e.clientX-drag.dx));tools[name].y=Math.max(0,Math.min(maxY,e.clientY-drag.dy));el.style.left=tools[name].x+'px';el.style.top=tools[name].y+'px'});
  handle.addEventListener('pointerup',()=>{if(drag){drag=null;save()}});handle.addEventListener('pointercancel',()=>drag=null);
}
function enableIconDrag(el,name){
  const icon=el.querySelector('.tool-icon');let drag=null,moved=false;
  icon.addEventListener('pointerdown',e=>{drag={startX:e.clientX,startY:e.clientY,dx:e.clientX-el.offsetLeft,dy:e.clientY-el.offsetTop};moved=false;icon.setPointerCapture(e.pointerId)});
  icon.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)moved=true;if(!moved)return;const maxX=1536-el.offsetWidth,maxY=1024-el.offsetHeight;tools[name].x=Math.max(0,Math.min(maxX,e.clientX-drag.dx));tools[name].y=Math.max(0,Math.min(maxY,e.clientY-drag.dy));el.style.left=tools[name].x+'px';el.style.top=tools[name].y+'px'});
  icon.addEventListener('pointerup',()=>{if(moved)save();drag=null});icon.addEventListener('pointercancel',()=>{drag=null;moved=false});
  icon.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false}},true);
}

function enableResize(el,name){
  let timer;
  const observer=new ResizeObserver(()=>{
    if(tools[name].collapsed)return;
    tools[name].w=Math.round(el.offsetWidth);
    tools[name].h=Math.round(el.offsetHeight);
    clearTimeout(timer);timer=setTimeout(()=>save(),120);
  });
  observer.observe(el);
}

const notebook=document.getElementById('notebookTool');
notebook.querySelectorAll('[data-tool-toggle]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();tools.notebook.collapsed=!tools.notebook.collapsed;renderNotebook();save()}));
bindTabManagement(notebook,'notebook',()=>{tools.notebook.tabs[tools.notebook.activeTab]=notebook.querySelector('[data-note-editor]').innerHTML});
const editor=notebook.querySelector('[data-note-editor]');
editor.addEventListener('input',()=>{tools.notebook.tabs[tools.notebook.activeTab]=editor.innerHTML;save()});
editor.addEventListener('keydown',e=>{
  if(e.key==='Tab'){e.preventDefault();document.execCommand(e.shiftKey?'outdent':'indent',false,null);tools.notebook.tabs[tools.notebook.activeTab]=editor.innerHTML;save()}
});
notebook.querySelectorAll('[data-command]').forEach(btn=>btn.addEventListener('click',()=>{
  editor.focus();document.execCommand(btn.dataset.command,false,btn.dataset.value||null);tools.notebook.tabs[tools.notebook.activeTab]=editor.innerHTML;save();
}));
notebook.querySelector('[data-checklist]').addEventListener('click',()=>{
  editor.focus();document.execCommand('insertHTML',false,'<div class="check-line"><input type="checkbox" contenteditable="false"><span>Checklist item</span></div>');
  tools.notebook.tabs[tools.notebook.activeTab]=editor.innerHTML;save();
});
editor.addEventListener('change',()=>{tools.notebook.tabs[tools.notebook.activeTab]=editor.innerHTML;save()});
const noteSearch=notebook.querySelector('[data-note-search]'),searchStatus=notebook.querySelector('[data-note-search-status]');
noteSearch.addEventListener('input',()=>{
  const q=noteSearch.value.trim();if(!q){searchStatus.textContent='';return}
  const text=editor.innerText.toLowerCase(),needle=q.toLowerCase();let count=0,pos=0;while((pos=text.indexOf(needle,pos))!==-1){count++;pos+=needle.length||1}
  searchStatus.textContent=count?`${count} match${count===1?'':'es'} in this tab`:'No matches in this tab';
  if(count) window.find(q,false,false,true,false,false,false);
});
enableDrag(notebook,'notebook');
enableIconDrag(notebook,'notebook');
enableResize(notebook,'notebook');

const backpack=document.getElementById('backpackTool');
backpack.querySelectorAll('[data-tool-toggle]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();tools.backpack.collapsed=!tools.backpack.collapsed;renderBackpack();save()}));
bindTabManagement(backpack,'backpack');
backpack.querySelector('[data-tool-search]').addEventListener('input',renderBackpack);
backpack.querySelector('[data-add-entry]').addEventListener('click',()=>{tools.backpack.tabs[tools.backpack.activeTab].push({name:'',detail:'',qty:'1'});renderBackpack();save();const inputs=backpack.querySelectorAll('.entry-name');inputs[inputs.length-1]?.focus()});
backpack.querySelector('[data-tool-list]').addEventListener('input',e=>{const row=e.target.closest('[data-entry-index]');if(!row)return;const entry=tools.backpack.tabs[tools.backpack.activeTab][Number(row.dataset.entryIndex)];if(e.target.classList.contains('entry-name'))entry.name=e.target.value;if(e.target.classList.contains('entry-detail'))entry.detail=e.target.value;if(e.target.classList.contains('entry-qty'))entry.qty=e.target.value;save()});
backpack.querySelector('[data-tool-list]').addEventListener('click',e=>{if(!e.target.matches('[data-delete-entry]'))return;const row=e.target.closest('[data-entry-index]');tools.backpack.tabs[tools.backpack.activeTab].splice(Number(row.dataset.entryIndex),1);renderBackpack();save()});
enableDrag(backpack,'backpack');
enableIconDrag(backpack,'backpack');
enableResize(backpack,'backpack');

const coin=document.getElementById('coinTool');
coin.querySelectorAll('[data-tool-toggle]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();tools.coin.collapsed=!tools.coin.collapsed;renderCoin();save()}));
function changeCoins(delta){
  const type=coin.querySelector('[data-coin-type]').value;
  const note=coin.querySelector('[data-coin-note]').value.trim();
  const before=Math.max(0,Math.floor(Number(tools.coin.balances[type])||0));
  const requested=Math.trunc(Number(delta)||0);
  const after=Math.max(0,before+requested);
  const actual=after-before;
  if(!actual){say('Coin amount is already zero.');return}
  tools.coin.balances[type]=after;
  tools.coin.history.unshift({id:Date.now()+Math.random(),type,delta:actual,after,note,time:new Date().toISOString()});
  tools.coin.history=tools.coin.history.slice(0,250);
  coin.querySelector('[data-coin-note]').value='';
  renderCoin();save();say(`${actual>0?'Added':'Removed'} ${Math.abs(actual)} ${type}.`);
}
coin.querySelectorAll('[data-coin-change]').forEach(b=>b.addEventListener('click',()=>changeCoins(Number(b.dataset.coinChange))));
coin.querySelectorAll('[data-coin-custom]').forEach(b=>b.addEventListener('click',()=>{
  const amount=Math.max(1,Math.floor(Number(coin.querySelector('[data-coin-amount]').value)||1));
  changeCoins(b.dataset.coinCustom==='add'?amount:-amount);
}));
coin.querySelector('[data-coin-amount]').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();changeCoins(Math.max(1,Math.floor(Number(e.target.value)||1)))}});
coin.querySelector('[data-toggle-coin-history]').addEventListener('click',()=>{tools.coin.historyCollapsed=!tools.coin.historyCollapsed;renderCoin();save()});
coin.querySelector('[data-clear-coin-history]').addEventListener('click',()=>{if(!tools.coin.history.length)return;if(confirm('Clear the coin change history? Current balances will stay the same.')){tools.coin.history=[];renderCoin();save()}});
enableDrag(coin,'coin');
enableIconDrag(coin,'coin');
enableResize(coin,'coin');


const characterBook=document.getElementById('characterBookTool');
characterBook.querySelectorAll('[data-tool-toggle]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();tools.characterBook.collapsed=!tools.characterBook.collapsed;renderCharacterBook();save()}));
function toggleBookSection(section){const open=tools.characterBook.openSections||(tools.characterBook.openSections=['overview']);const index=open.indexOf(section);if(index>=0){if(open.length===1){say('Keep at least one book section open.');return}open.splice(index,1)}else open.push(section);tools.characterBook.activeTab=section;renderCharacterBook();save()}
function focusBookSection(section){
  const open=tools.characterBook.openSections||(tools.characterBook.openSections=['overview']);
  if(!open.includes(section))open.push(section);
  tools.characterBook.activeTab=section;
  renderCharacterBook();
  save();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const page=characterBook.querySelector(`[data-book-page="${section}"]`);
    const tab=characterBook.querySelector(`[data-book-tab="${section}"]`);
    const body=characterBook.querySelector('.character-book-body');
    const heading=page?.querySelector('[data-book-section-toggle]');
    if(!page||!body||!heading)return;
    const bodyRect=body.getBoundingClientRect();
    const pageRect=page.getBoundingClientRect();
    const mobile=window.matchMedia('(max-width: 760px)').matches;
    const current=body.scrollTop;
    const relativeTop=pageRect.top-bodyRect.top+current;
    const tabs=characterBook.querySelector('.book-tabs');
    const stickyAllowance=(tabs?.offsetHeight||48)+(mobile?14:18);
    const available=Math.max(120,body.clientHeight-stickyAllowance-16);
    const pageHeight=page.offsetHeight;
    // Put the full section in view whenever it fits. Longer sections begin directly
    // beneath the sticky bookmarks so their complete content can be read naturally.
    const target=pageHeight<=available
      ? relativeTop-stickyAllowance-Math.max(0,(available-pageHeight)/2)
      : relativeTop-stickyAllowance;
    body.scrollTo({top:Math.max(0,target),behavior:'smooth'});
    tab?.classList.remove('book-nav-pulse');
    page.classList.remove('book-section-focus');
    void page.offsetWidth;
    tab?.classList.add('book-nav-pulse');
    page.classList.add('book-section-focus');
    window.setTimeout(()=>{tab?.classList.remove('book-nav-pulse');page.classList.remove('book-section-focus')},1100);
  }));
}
characterBook.querySelector('.book-tabs').addEventListener('click',e=>{
  if(e.target.closest('[data-book-collapse-all]')){tools.characterBook.openSections=[];renderCharacterBook();save();say('All Character Tome sections collapsed.');return}
  if(e.target.closest('[data-book-return-top]')){const body=characterBook.querySelector('.character-book-body');body?.scrollTo({top:0,behavior:'smooth'});return}
  const tab=e.target.closest('[data-book-tab]')?.dataset.bookTab;if(tab)focusBookSection(tab)
});
characterBook.addEventListener('input',e=>{const key=e.target.dataset.bookField;if(!key)return;setSourceField(key,e.target.value);if(key==='infectionLevel')syncInfectionConditionFromLevel();atmosphere();renderCharacterBook();save()});
characterBook.addEventListener('input',e=>{const slot=e.target.dataset.equipmentSlot;if(!slot)return;tools.characterBook.equipment=tools.characterBook.equipment||{};tools.characterBook.equipment[slot]=e.target.value;save()});
characterBook.addEventListener('change',e=>{const condition=e.target.dataset.bookCondition;if(!condition)return;const src=document.querySelector(`[data-condition="${condition}"]`);if(src){src.checked=e.target.checked;playStatusSound(condition,e.target.checked);src.dispatchEvent(new Event('change',{bubbles:true}));renderCharacterBook()}});
characterBook.addEventListener('click',e=>{
  const stepControl=e.target.closest('[data-stat-step]');if(stepControl){const [key,rawStep]=stepControl.dataset.statStep.split(':');const step=Number(rawStep)||0;const src=sourceField(key);if(src){const min=src.min!==''?Number(src.min):-Infinity,max=src.max!==''?Number(src.max):Infinity;const next=Math.max(min,Math.min(max,(Number(src.value)||0)+step));setSourceField(key,String(next));if(key==='infectionLevel')syncInfectionConditionFromLevel();renderCharacterBook();save()}return}
  const section=e.target.closest('[data-book-section-toggle]')?.dataset.bookSectionToggle;if(section){toggleBookSection(section);return}
  const hp=e.target.closest('[data-book-hp]');if(hp){applyHealthChange(Number(hp.dataset.bookHp));return}
  const open=e.target.closest('[data-open-tool]')?.dataset.openTool;if(open&&tools[open]){tools[open].collapsed=false;renderAllTools();save();return}
  const inspirationButton=e.target.closest('[data-set-inspiration]');if(inspirationButton){setSourceField('inspirationPoints',inspirationButton.dataset.setInspiration);renderCharacterBook();save();say(`Inspiration set to ${inspirationButton.dataset.setInspiration}.`);return}
  if(e.target.closest('[data-generate-quip]')){const prompt=characterBook.querySelector('[data-quip-prompt]')?.value||'';const text=generateCharacterQuip(prompt);const now=new Date().toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});tools.characterBook.quips=[{text:text.replace(/^“|”$/g,''),time:now},...(tools.characterBook.quips||[])].slice(0,12);const display=characterBook.querySelector('[data-generated-quip]');if(display)display.textContent=text;renderCharacterBook();save();return}
  if(e.target.closest('[data-toggle-quip-history]')){tools.characterBook.quipHistoryCollapsed=!tools.characterBook.quipHistoryCollapsed;renderCharacterBook();save();return}
  if(e.target.closest('[data-clear-quips]')){tools.characterBook.quips=[];renderCharacterBook();save();say('Quip history cleared.');return}
  if(e.target.closest('[data-reset-conditions]')){
    const active=conditions.filter(box=>box.checked);
    if(!active.length){say('No active conditions to reset.');return}
    active.forEach(box=>box.checked=false);setSourceField('infectionLevel','0');playResetStatusSound();health();atmosphere();renderCharacterBook();save();say('All status conditions cleared.');return
  }
  if(e.target.closest('[data-book-roll]')){const k=characterBook.querySelector('[data-book-roll-attribute]').value,r=Math.floor(Math.random()*20)+1,mod=num(k),t=r+mod;characterBook.querySelector('[data-book-roll-result]').textContent=`${humanizeTab(k)}: ${r} + ${mod} = ${t}${r===20?' — Natural 20!':r===1?' — Natural 1.':''}`}
});
enableDrag(characterBook,'characterBook');enableIconDrag(characterBook,'characterBook');enableResize(characterBook,'characterBook');


// Accelerated wheel/trackpad scrolling inside the three draggable tools.
// Shift + wheel scrolls even faster for quickly skimming long notes and ledgers.
function enableFastScroll(root){
  root.addEventListener('wheel',e=>{
    const area=e.target.closest('.note-editor,.tool-list,.coin-history,.entry-detail');
    if(!area||area.scrollHeight<=area.clientHeight)return;
    const direction=Math.sign(e.deltaY||0);
    if(!direction)return;
    const multiplier=e.shiftKey?3.6:1.65;
    area.scrollTop+=e.deltaY*multiplier;
    e.preventDefault();
    e.stopPropagation();
  },{passive:false});
}
enableFastScroll(notebook);
enableFastScroll(backpack);
enableFastScroll(coin);

fields.forEach(e=>e.addEventListener('input',()=>{if(e.dataset.key==='infectionLevel')syncInfectionConditionFromLevel();health();atmosphere();renderCharacterBook();save()}));conditions.forEach(e=>e.addEventListener('change',event=>{if(event.isTrusted)playStatusSound(e.dataset.condition,e.checked);atmosphere();renderCharacterBook();save()}));
document.querySelectorAll('[data-hp]').forEach(b=>b.onclick=()=>applyHealthChange(Number(b.dataset.hp)));
document.getElementById('rollBtn').onclick=()=>{const k=document.getElementById('rollAttribute').value,r=Math.floor(Math.random()*20)+1,mod=num(k),t=r+mod;document.getElementById('rollResult').textContent=`${k[0].toUpperCase()+k.slice(1)}: ${r} + ${mod} = ${t}${r===20?' — Natural 20!':r===1?' — Natural 1.':''}`};
document.getElementById('saveBtn').onclick=()=>save(true);
document.getElementById('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(document.querySelector('[data-key="name"]').value||'eldritch-character')+'.json';a.click();URL.revokeObjectURL(url);say('Character exported.')};
document.getElementById('importInput').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{apply(JSON.parse(await f.text()));save();say('Character imported.')}catch{alert('Invalid character file.')}e.target.value=''};
document.getElementById('soundToggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;localStorage.setItem(SOUND_KEY,String(soundEnabled));updateSoundToggle();if(soundEnabled)playHealthChangeSound('gain',1);say(soundEnabled?'Sound effects enabled.':'Sound effects muted.')});
updateSoundToggle();
document.getElementById('resetBtn').onclick=()=>{if(!confirm('Erase this sheet and local save?'))return;localStorage.removeItem(KEY);LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));fields.forEach(e=>e.value='');conditions.forEach(e=>e.checked=false);tools=cloneDefaults();document.querySelectorAll('input[type="search"]').forEach(e=>e.value='');renderAllTools();health();atmosphere();say('Character reset.')};
try{let raw=localStorage.getItem(KEY);if(!raw){for(const k of LEGACY_KEYS){raw=localStorage.getItem(k);if(raw)break}}if(raw)apply(JSON.parse(raw));else renderAllTools()}catch(e){console.error(e);renderAllTools()}syncInfectionConditionFromLevel({silent:true});health();atmosphere();renderCharacterBook();
