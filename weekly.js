'use strict';

function toggleMenu(){
  const cfg=document.getElementById('cfg');
  const bd=document.getElementById('menu-backdrop');
  cfg.classList.toggle('open');
  bd.style.display=cfg.classList.contains('open')?'block':'none';
}

let previewZoom=1;
function adjustZoom(delta){
  previewZoom=Math.max(0.25,Math.min(3,Math.round((previewZoom+delta)*10)/10));
  const z=previewZoom;
  ['page-preview','book-view','print-area'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.zoom=z;
  });
  const lbl=document.getElementById('zoom-level');
  if(lbl) lbl.textContent=Math.round(z*100)+'%';
}

/* ══════════════════════════════════════════════
   STATE & DEFAULTS
   ══════════════════════════════════════════════ */
let habits = [];
let bottomBoxes = [];
let selectedIcon = 'star';
let pickerBuilt = false;
let selectedDays = [0,1,2,3,4,5,6];
let inspectorContext = {habitId:null, fieldId:null};
const STORAGE_KEY = 'tn-weekly-planner';

/* ── Theme presets ── */
const THEMES = {
  'Classic Warm':  { ink:'#1a1a2e', dim:'#7a7870', bg:'#ede9e2', page:'#ffffff', dot:'#c5c2bb', line:'#ddd9d3', acc:'#4a4262' },
  'Cool Gray':     { ink:'#2c2c34', dim:'#8a8a96', bg:'#e8eaed', page:'#ffffff', dot:'#c4c6cc', line:'#d8dae0', acc:'#4a5568' },
  'Midnight Blue': { ink:'#0f172a', dim:'#64748b', bg:'#e2e8f0', page:'#ffffff', dot:'#b0b8c8', line:'#cbd5e1', acc:'#1e3a5f' },
  'Forest':        { ink:'#1a2e1a', dim:'#6b7a65', bg:'#e6ece2', page:'#ffffff', dot:'#b5c4ab', line:'#d0dcc8', acc:'#2d5a2d' },
  'Rose':          { ink:'#2e1a22', dim:'#8a7078', bg:'#f0e6ea', page:'#ffffff', dot:'#d4b8c2', line:'#e4d0d8', acc:'#6b3a50' },
  'Minimal B&W':   { ink:'#111111', dim:'#888888', bg:'#f0f0f0', page:'#ffffff', dot:'#cccccc', line:'#dddddd', acc:'#333333' }
};

const COLOR_VARS = ['ink','dim','bg','page','dot','line','acc'];
const COLOR_LABELS = { ink:'Ink', dim:'Dim text', bg:'Background', page:'Page', dot:'Dot grid', line:'Lines', acc:'Accent' };

/* ── Graph metrics ── */
let graphMetrics = [{id:1,title:'Weight',min:null,max:null,step:null},{id:2,title:'Steps',min:null,max:null,step:null}];

/* ── Daily fields ── */
let dailyFields = [{id:1,label:'Steps'},{id:2,label:'Wt'}];

/* ── Custom holidays / events (repeat yearly) ── */
let customHolidays = [];

/* ── Options defaults ── */
let opts = {
  tnsize: 'passport',
  paperSize: 'a4',
  customTnW: 89,
  customTnH: 124,
  theme: 'Classic Warm',
  colors: {},
  font: 'Georgia',
  margin: 6,
  checkbox: 'square',
  cbsize: 5,
  linestyle: 'solid',
  dotgrid: 5,
  graphcol: 1,
  daylbl: 7,
  graphborders: true,
  weekstart: 'monday',
  mood: true,
  moodfaces: 5,
  notes: 1,
  notespos: 'front',
  cover: false,
  covertitle: '',
  coverDesign: 'framed',
  backCover: false,
  calendar: false,
  cropmarks: true,
  foldline: true,
  pagenums: false,
  flip: 'long',
  colorIcons: true,
  linkFieldsGraphs: true,
  emptyLines: 4,
  calSpread: false,
  calNumSz: 6.5,
  calHolSz: 4.5,
  fillPattern: 'dots',
  customFont: '',
  printGuide: false,
  coverAccent: 'gold',
  coverFontSize: 12,
  coverImage: '',
  backCoverDesign: 'simple',
  backCoverImage: '',
  coverSheet: false,
  habitMap: false,
  goalsPage: false,
  moodCal: false,
  expenseTracker: false,
  reflectionPage: false,
  moonPhase: false,
  weatherIcons: false,
  weatherIconSize: 3.5,
  energyBattery: false,
  batterySegs: 5,
  batteryStroke: 0.4,
  iconSize: 5,
  iconGap: 1.5,
  iconStroke: 1.5,
  fzWeekHdr: 6,
  fzDow: 6,
  fzDayNum: 18,
  fzHabit: 6,
  fzFieldLbl: 4.5,
  fzMoodSz: 5,
  habRowGap: 1.5,
  moodGap: 2,
  moonSize: 3.5,
  savePaper: false,
  holidays: false,
  holidayCountry: 'US',
  holidayState: '',
  elementColors: {},
  elementFonts: {},
};

const OPT_DEFAULTS = {
  habRowGap:1.5, checkbox:'square', cbsize:5, iconSize:5, iconStroke:1.5, iconGap:1.5,
  fzHabit:6, fzDayNum:18, fzDow:6, fzWeekHdr:6, fzFieldLbl:4.5, fzMoodSz:5,
  calNumSz:6.5, calHolSz:4.5,
  moonSize:3.5, moodGap:2, moodfaces:5, coverFontSize:12, fillPattern:'dots', dotgrid:5, graphcol:1,
  weatherIconSize:3.5, batterySegs:5,
};

/* ── Constants ── */
const TN_SIZES = {
  'passport':  { label:'Passport',    w:89,  h:124 },
  'b6slim':    { label:'B6 Slim',     w:91,  h:182 },
  'personal':  { label:'Personal',    w:95,  h:171 },
  'a5slim':    { label:'A5 Slim',     w:105, h:210 },
  'regular':   { label:'Regular',     w:110, h:210 },
};

const PAPER_SIZES = {
  'a4':     { label:'A4',        w:297,   h:210,   page:'A4 landscape' },
  'letter': { label:'US Letter', w:279.4, h:215.9, page:'letter landscape' },
  'legal':  { label:'US Legal',  w:355.6, h:215.9, page:'legal landscape' },
  'a3':     { label:'A3',        w:420,   h:297,   page:'A3 landscape' },
};

const ICON_COLORS = {
  'droplets':'#4a9ece','dumbbell':'#e06050','bike':'#e08830','brain':'#c070c8',
  'moon':'#7880c0','sun':'#e8b830','book-open':'#6a8858','heart':'#e05070',
  'activity':'#e06050','utensils':'#c08040','apple':'#50b060','coffee':'#8a6a4a',
  'pill':'#50a0b8','music':'#9060b0','pencil':'#c8a040','leaf':'#50a858',
  'bed':'#7080a0','zap':'#d8b030','star':'#d8a830','flame':'#e07030',
  'timer':'#6888a8','eye':'#5898b8','footprints':'#a08870','target':'#d05050',
  'shield':'#5878a8','baby':'#e8a0b0','cat':'#c09060','dog':'#a08050'
};
const HABIT_ICONS = [
  'droplets','dumbbell','bike','brain','moon','sun',
  'book-open','heart','activity','utensils','apple','coffee',
  'pill','music','pencil','leaf','bed','zap',
  'star','flame','timer','eye','footprints','target',
  'shield','baby','cat','dog'
];

const COVER_ACCENTS = {
  gold:   { main:'#c4a35a', dim:'#8a7a4a' },
  silver: { main:'#a8aab0', dim:'#707478' },
  copper: { main:'#b87333', dim:'#8a5a2a' },
  white:  { main:'#e8e4dc', dim:'#b0aaa0' }
};

const MOOD_ICONS3 = ['frown','meh','smile'];
const MOOD_ICONS5 = ['angry','frown','meh','smile','laugh'];

function getElemColor(key, fallback){
  return (opts.elementColors && opts.elementColors[key]) || fallback;
}
function getElemFont(key){
  return (opts.elementFonts && opts.elementFonts[key]) || null;
}
function getHabitIconColor(h, colors){
  if(h.iconColor) return h.iconColor;
  return getElemColor('habitIcon', iconColor(h.icon, colors.dim));
}
function getHabitNameColor(h, colors){
  if(h.color) return h.color;
  return getElemColor('habitName', colors.ink);
}
function getHabitFont(h){
  return h.font || getElemFont('habitName') || null;
}
function getPageColors(){
  const c=getColors(); const seen=new Set(); const out=[];
  const add=v=>{if(v&&!seen.has(v)){seen.add(v);out.push(v);}};
  Object.values(c).forEach(add);
  if(opts.colors) Object.values(opts.colors).forEach(add);
  if(opts.elementColors) Object.values(opts.elementColors).forEach(add);
  Object.values(ICON_COLORS).forEach(add);
  return out;
}

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DOW_ABB3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WDAY_LBL_MON = ['M','T','W','T','F','S','S'];
const WDAY_LBL_SUN = ['S','M','T','W','T','F','S'];

const $ = id => document.getElementById(id);
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function firstDow(y,m){return new Date(y,m,1).getDay();}
function dow(y,m,d){return new Date(y,m,d).getDay();}

function getWdayLabels(){ return opts.weekstart==='sunday' ? WDAY_LBL_SUN : WDAY_LBL_MON; }

/* ══ Holidays ══ */
// n-th (1-based) weekday wd (0=Sun..6=Sat) of month m
function nthWeekday(y,m,wd,n){
  const first=new Date(y,m,1).getDay();
  return 1+((wd-first+7)%7)+(n-1)*7;
}
// last weekday wd of month m
function lastWeekday(y,m,wd){
  const last=new Date(y,m+1,0);
  return last.getDate()-((last.getDay()-wd+7)%7);
}
// last weekday wd strictly before day `before` in month m
function weekdayBefore(y,m,wd,before){
  for(let d=before-1;d>=before-7;d--) if(new Date(y,m,d).getDay()===wd) return d;
  return before;
}
// Easter Sunday (Anonymous Gregorian algorithm) → {m,d} month 0-indexed
function easterSunday(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
    f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
    i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,mm=Math.floor((a+11*h+22*l)/451),
    month=Math.floor((h+l-7*mm+114)/31),day=((h+l-7*mm+114)%31)+1;
  return {m:month-1,d:day};
}
function offsetDate(p,y,n){ const dt=new Date(y,p.m,p.d+n); return {m:dt.getMonth(),d:dt.getDate()}; }

const HOLIDAY_SETS = {
  US:y=>[
    {m:0,d:1,name:"New Year's Day"},
    {m:0,d:nthWeekday(y,0,1,3),name:"Martin Luther King Jr. Day"},
    {m:1,d:nthWeekday(y,1,1,3),name:"Presidents' Day"},
    {m:4,d:lastWeekday(y,4,1),name:"Memorial Day"},
    {m:5,d:19,name:"Juneteenth"},
    {m:6,d:4,name:"Independence Day"},
    {m:8,d:nthWeekday(y,8,1,1),name:"Labor Day"},
    {m:9,d:nthWeekday(y,9,1,2),name:"Columbus Day"},
    {m:10,d:11,name:"Veterans Day"},
    {m:10,d:nthWeekday(y,10,4,4),name:"Thanksgiving"},
    {m:11,d:25,name:"Christmas Day"},
  ],
  GB:y=>{ const e=easterSunday(y),gf=offsetDate(e,y,-2),em=offsetDate(e,y,1); return [
    {m:0,d:1,name:"New Year's Day"},
    {m:gf.m,d:gf.d,name:"Good Friday"},
    {m:em.m,d:em.d,name:"Easter Monday"},
    {m:4,d:nthWeekday(y,4,1,1),name:"Early May Bank Holiday"},
    {m:4,d:lastWeekday(y,4,1),name:"Spring Bank Holiday"},
    {m:7,d:lastWeekday(y,7,1),name:"Summer Bank Holiday"},
    {m:11,d:25,name:"Christmas Day"},
    {m:11,d:26,name:"Boxing Day"},
  ];},
  CA:y=>{ const e=easterSunday(y),gf=offsetDate(e,y,-2); return [
    {m:0,d:1,name:"New Year's Day"},
    {m:1,d:nthWeekday(y,1,1,3),name:"Family Day"},
    {m:gf.m,d:gf.d,name:"Good Friday"},
    {m:4,d:weekdayBefore(y,4,1,25),name:"Victoria Day"},
    {m:6,d:1,name:"Canada Day"},
    {m:8,d:nthWeekday(y,8,1,1),name:"Labour Day"},
    {m:9,d:nthWeekday(y,9,1,2),name:"Thanksgiving"},
    {m:10,d:11,name:"Remembrance Day"},
    {m:11,d:25,name:"Christmas Day"},
    {m:11,d:26,name:"Boxing Day"},
  ];},
  AU:y=>{ const e=easterSunday(y),gf=offsetDate(e,y,-2),em=offsetDate(e,y,1); return [
    {m:0,d:1,name:"New Year's Day"},
    {m:0,d:26,name:"Australia Day"},
    {m:gf.m,d:gf.d,name:"Good Friday"},
    {m:em.m,d:em.d,name:"Easter Monday"},
    {m:3,d:25,name:"Anzac Day"},
    {m:11,d:25,name:"Christmas Day"},
    {m:11,d:26,name:"Boxing Day"},
  ];},
};

// ── Worldwide holiday library (date-holidays), lazy-loaded from CDN ──
let holidayLibPromise=null;
function ensureHolidayLib(){
  if(typeof window.Holidays==='function') return Promise.resolve(true);
  if(holidayLibPromise) return holidayLibPromise;
  holidayLibPromise=new Promise(res=>{
    const s=document.createElement('script');
    s.src='https://unpkg.com/date-holidays/dist/umd.min.js';
    s.async=true;
    s.onload=()=>{
      // UMD build may export { default: ctor }; normalize to a constructor on window.Holidays
      if(window.Holidays && typeof window.Holidays!=='function' && typeof window.Holidays.default==='function'){
        window.Holidays=window.Holidays.default;
      }
      res(typeof window.Holidays==='function');
    };
    s.onerror=()=>res(false);
    document.head.appendChild(s);
  });
  return holidayLibPromise;
}
function fallbackBuiltin(y,m,add){
  const set=HOLIDAY_SETS[opts.holidayCountry]||HOLIDAY_SETS.US;
  set(y).forEach(h=>{ if(h.m===m) add(h.d,h.name); });
}

// day(1..31) → [names] for month m of year y
function holidayMap(y,m){
  const map={};
  const add=(d,name)=>{ if(name && !(map[d]&&map[d].includes(name))) (map[d]=map[d]||[]).push(name); };
  if(opts.holidays){
    if(typeof window.Holidays==='function'){
      try{
        const hd=new Holidays(opts.holidayCountry||'US', opts.holidayState||undefined);
        (hd.getHolidays(y)||[]).forEach(h=>{
          if(h.type!=='public'&&h.type!=='bank') return;
          const dt=h.start||new Date(String(h.date).replace(' ','T'));
          if(dt.getFullYear()===y && dt.getMonth()===m) add(dt.getDate(), h.name);
        });
      }catch(e){ fallbackBuiltin(y,m,add); }
    } else {
      fallbackBuiltin(y,m,add);
    }
  }
  customHolidays.forEach(h=>{ if(h.month===m) add(h.day,h.name); });
  return map;
}

function populateHolidayCountries(){
  const sel=$('opt-holidaycountry');
  if(!sel||!window.Holidays||sel.dataset.full) return;
  const countries=new Holidays().getCountries()||{};
  const cur=opts.holidayCountry||'US';
  sel.innerHTML='';
  Object.keys(countries).sort((a,b)=>countries[a].localeCompare(countries[b])).forEach(code=>{
    const o=document.createElement('option'); o.value=code; o.textContent=countries[code]; sel.appendChild(o);
  });
  sel.value=countries[cur]?cur:'US';
  opts.holidayCountry=sel.value;
  sel.dataset.full='1';
  const st=$('holiday-lib-status'); if(st) st.textContent=Object.keys(countries).length+' countries available.';
  populateHolidayStates();
}
function populateHolidayStates(){
  const ssel=$('opt-holidaystate');
  if(!ssel) return;
  if(!window.Holidays){ ssel.style.display='none'; return; }
  const states=new Holidays().getStates($('opt-holidaycountry').value)||{};
  const keys=Object.keys(states);
  if(!keys.length){ ssel.style.display='none'; ssel.innerHTML='<option value="">— Whole country —</option>'; opts.holidayState=''; return; }
  ssel.style.display='';
  ssel.innerHTML='<option value="">— Whole country —</option>';
  keys.sort((a,b)=>states[a].localeCompare(states[b])).forEach(k=>{
    const o=document.createElement('option'); o.value=k; o.textContent=states[k]; ssel.appendChild(o);
  });
  ssel.value=states[opts.holidayState]?opts.holidayState:'';
  opts.holidayState=ssel.value;
}
function onHolidayChange(){
  readOptsFromUI();
  if(opts.holidays){
    ensureHolidayLib().then(ok=>{ if(ok){ populateHolidayCountries(); } generate(); });
  }
  generate();
}
function onHolidayCountryChange(){
  readOptsFromUI();
  populateHolidayStates();
  readOptsFromUI();
  generate();
}

/* ── Resolve active colors ── */
function getColors(){
  const base = THEMES[opts.theme] || THEMES['Classic Warm'];
  const merged = {...base};
  COLOR_VARS.forEach(k=>{ if(opts.colors[k]) merged[k]=opts.colors[k]; });
  return merged;
}

/* ══════════════════════════════════════════════
   COLLAPSIBLE SECTIONS
   ══════════════════════════════════════════════ */
function toggleSection(id){
  const sec=document.getElementById(id);
  const hdr=sec.querySelector('.coll-hdr');
  const body=sec.querySelector('.coll-body');
  hdr.classList.toggle('open');
  body.classList.toggle('open');
}

/* ══════════════════════════════════════════════
   THEME UI
   ══════════════════════════════════════════════ */
function buildThemeGrid(){
  const grid=$('theme-grid');
  grid.innerHTML='';
  Object.entries(THEMES).forEach(([name,colors])=>{
    const btn=document.createElement('button');
    btn.className='theme-btn'+(opts.theme===name?' active':'');
    btn.type='button';
    const swatch=el('div','theme-swatch');
    ['ink','acc','page','dot'].forEach(k=>{
      const s=document.createElement('span');
      s.style.background=colors[k];
      swatch.appendChild(s);
    });
    btn.appendChild(swatch);
    btn.appendChild(document.createTextNode(name));
    btn.onclick=()=>{
      opts.theme=name;
      opts.colors={};
      buildThemeGrid();
      buildColorOverrides();
      onOptionChange();
    };
    grid.appendChild(btn);
  });
}

function buildColorOverrides(){
  const grid=$('color-overrides');
  grid.innerHTML='';
  const colors=getColors();
  COLOR_VARS.forEach(k=>{
    const row=el('div','color-row');
    const lbl=el('label','',COLOR_LABELS[k]);
    const inp=document.createElement('input');
    inp.type='color';
    inp.value=colors[k];
    inp.dataset.key=k;
    inp.addEventListener('input',function(){
      opts.colors[this.dataset.key]=this.value;
      onOptionChange();
    });
    row.appendChild(lbl);
    row.appendChild(inp);
    grid.appendChild(row);
  });
}

/* ══════════════════════════════════════════════
   GRAPH METRICS UI
   ══════════════════════════════════════════════ */
function renderMetrics(){
  const list=$('metric-list');
  list.innerHTML='';
  graphMetrics.forEach(m=>{
    const row=el('div','metric-item');
    const inp=document.createElement('input');
    inp.type='text';inp.value=m.title;inp.style.cssText='width:76px;font-size:11px;padding:3px 6px;';
    inp.onchange=function(){ m.title=this.value; onOptionChange(); };
    row.appendChild(inp);

    const tog=el('button','btn btn-d','…');
    tog.title='Min / Max / Step';tog.style.cssText='font-size:12px;padding:2px 6px;';
    tog.onclick=()=>{ const d=row.querySelector('.metric-details'); d.style.display=d.style.display==='flex'?'none':'flex'; };
    row.appendChild(tog);

    const del=el('button','btn btn-d','×');
    del.onclick=()=>{ graphMetrics=graphMetrics.filter(x=>x.id!==m.id); renderMetrics(); onOptionChange(); };
    row.appendChild(del);

    const det=el('div','metric-details');
    const mkNum=(lbl,val,cb)=>{
      det.appendChild(el('span','metric-det-lbl',lbl));
      const ni=document.createElement('input');
      ni.type='number';ni.placeholder=lbl;ni.value=val??'';
      ni.style.cssText='width:40px;font-size:10px;padding:2px 4px;';
      ni.onchange=function(){ cb(this.value===''?null:+this.value); onOptionChange(); };
      det.appendChild(ni);
    };
    mkNum('Min',m.min,v=>{m.min=v;});
    mkNum('Max',m.max,v=>{m.max=v;});
    mkNum('Step',m.step,v=>{m.step=v;});
    row.appendChild(det);
    list.appendChild(row);
  });
}
function addMetric(){
  const name=$('metric-name').value.trim();
  if(!name)return;
  graphMetrics.push({id:Date.now(),title:name,min:null,max:null,step:null});
  $('metric-name').value='';
  renderMetrics(); onOptionChange();
}

/* ══════════════════════════════════════════════
   DAILY FIELDS UI
   ══════════════════════════════════════════════ */
function renderDailyFields(){
  const list=$('daily-field-list');
  list.innerHTML='';
  dailyFields.forEach(f=>{
    const row=el('div','daily-field-item');
    const inp=document.createElement('input');
    inp.type='text';inp.value=f.label;
    inp.onchange=function(){ f.label=this.value; onOptionChange(); };
    row.appendChild(inp);
    const del=el('button','btn btn-d','x');
    del.onclick=()=>{ dailyFields=dailyFields.filter(x=>x.id!==f.id); renderDailyFields(); onOptionChange(); };
    row.appendChild(del);
    list.appendChild(row);
  });
}
function addDailyField(){
  const name=$('daily-field-name').value.trim();
  if(!name)return;
  dailyFields.push({id:Date.now(),label:name});
  $('daily-field-name').value='';
  renderDailyFields(); onOptionChange();
}

const MONTH_ABB=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function renderHolidays(){
  const list=$('holiday-list');
  if(!list) return;
  list.innerHTML='';
  customHolidays.slice().sort((a,b)=>a.month-b.month||a.day-b.day).forEach(h=>{
    const row=el('div','daily-field-item');
    const lbl=el('span',null,`${MONTH_ABB[h.month]} ${h.day} — ${h.name}`);
    lbl.style.cssText='flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    row.appendChild(lbl);
    const del=el('button','btn btn-d','x');
    del.onclick=()=>{ customHolidays=customHolidays.filter(x=>x.id!==h.id); renderHolidays(); generate(); };
    row.appendChild(del);
    list.appendChild(row);
  });
}
function addHoliday(){
  const name=$('holiday-name').value.trim();
  if(!name) return;
  const month=parseInt($('holiday-month').value);
  let day=parseInt($('holiday-day').value)||1;
  day=Math.min(31,Math.max(1,day));
  customHolidays.push({id:Date.now(),name,month,day});
  $('holiday-name').value='';
  renderHolidays(); generate();
}

/* ══════════════════════════════════════════════
   PERSISTENCE
   ══════════════════════════════════════════════ */
function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      habits, bottomBoxes, selectedIcon, selectedDays,
      month:parseInt($('sel-m').value), year:parseInt($('sel-y').value),
      opts, graphMetrics, dailyFields, customHolidays
    }));
  }catch(e){}
}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!s) return false;
    if(s.habits) habits=s.habits;
    if(s.bottomBoxes) bottomBoxes=s.bottomBoxes;
    if(s.selectedIcon) selectedIcon=s.selectedIcon;
    if(s.selectedDays) selectedDays=s.selectedDays;
    if(s.month!=null) $('sel-m').value=s.month;
    if(s.year!=null) $('sel-y').value=s.year;
    if(s.opts) opts={...opts,...s.opts};
    if(s.graphMetrics) graphMetrics=s.graphMetrics;
    if(s.dailyFields) dailyFields=s.dailyFields;
    if(s.customHolidays) customHolidays=s.customHolidays;
    return true;
  }catch(e){return false;}
}

function applyOptsToUI(){
  $('opt-tnsize').value=opts.tnsize;
  $('opt-papersize').value=opts.paperSize;
  $('opt-custom-tn-w').value=opts.customTnW;
  $('opt-custom-tn-h').value=opts.customTnH;
  $('custom-tn-row').style.display=opts.tnsize==='custom'?'flex':'none';
  $('opt-font').value=opts.font;
  $('opt-margin').value=opts.margin;
  $('opt-checkbox').value=opts.checkbox;
  $('opt-cbsize').value=opts.cbsize;
  $('opt-linestyle').value=opts.linestyle;
  $('opt-dotgrid').value=opts.dotgrid;
  $('opt-graphcol').value=opts.graphcol;
  $('opt-graphborders').checked=opts.graphborders;
  $('opt-weekstart').value=opts.weekstart;
  $('opt-mood').checked=opts.mood;
  $('opt-moodfaces').value=opts.moodfaces;
  $('opt-notes').value=opts.notes;
  $('opt-notespos').value=opts.notespos;
  $('opt-cover').checked=opts.cover;
  $('opt-covertitle').value=opts.covertitle||'';
  $('opt-coverdesign').value=opts.coverDesign;
  $('opt-backcover').checked=opts.backCover;
  $('opt-backcoverdesign').value=opts.backCoverDesign||'simple';
  $('opt-coversheet').checked=opts.coverSheet;
  $('opt-coveraccent').value=opts.coverAccent||'gold';
  $('opt-coverfontsize').value=opts.coverFontSize||12;
  $('opt-customfont').value=opts.customFont||'';
  $('opt-calendar').checked=opts.calendar;
  $('opt-calspread').checked=opts.calSpread;
  $('opt-cropmarks').checked=opts.cropmarks;
  $('opt-foldline').checked=opts.foldline;
  $('opt-pagenums').checked=opts.pagenums;
  $('opt-printguide').checked=opts.printGuide;
  $('opt-coloricons').checked=opts.colorIcons;
  $('opt-emptylines').value=opts.emptyLines;
  $('opt-fillpattern').value=opts.fillPattern;
  $('opt-habitmap').checked=opts.habitMap;
  $('opt-goalspage').checked=opts.goalsPage;
  $('opt-moodcal').checked=opts.moodCal;
  $('opt-expenses').checked=opts.expenseTracker;
  $('opt-reflection').checked=opts.reflectionPage;
  $('opt-linkfg').checked=opts.linkFieldsGraphs;
  $('metric-section').style.display=opts.linkFieldsGraphs?'none':'';
  $('opt-savepaper').checked=opts.savePaper;
  if($('opt-holidays')) $('opt-holidays').checked=opts.holidays;
  if($('opt-holidaycountry')) $('opt-holidaycountry').value=opts.holidayCountry||'US';
  if($('opt-holidaystate')){ const ss=$('opt-holidaystate'); if([...ss.options].some(o=>o.value===opts.holidayState)) ss.value=opts.holidayState||''; }
  $('opt-moonphase').checked=opts.moonPhase;
  $('opt-weathericons').checked=opts.weatherIcons;
  $('opt-energybattery').checked=opts.energyBattery;
  if($('opt-batterysegs')) $('opt-batterysegs').value=opts.batterySegs??5;
  if(opts.flip==='short') $('flip-short').checked=true;
  else $('flip-long').checked=true;
  const rangeFields=[
    ['opt-iconsize','iconsize-val',opts.iconSize??5,'mm'],
    ['opt-icongap','icongap-val',opts.iconGap??1.5,'mm'],
    ['opt-iconstroke','iconstroke-val',opts.iconStroke??1.5,''],
    ['opt-fz-weekhdr','fzweekhdr-val',opts.fzWeekHdr??6,'pt'],
    ['opt-fz-dow','fzdow-val',opts.fzDow??6,'pt'],
    ['opt-fz-daynum','fzdaynum-val',opts.fzDayNum??18,'pt'],
    ['opt-fz-habit','fzhabit-val',opts.fzHabit??6,'pt'],
    ['opt-fz-fieldlbl','fzfieldlbl-val',opts.fzFieldLbl??4.5,'pt'],
    ['opt-fz-moodsz','fzmoodsz-val',opts.fzMoodSz??5,'mm'],
    ['opt-habrowgap','habrowgap-val',opts.habRowGap??1.5,'mm'],
    ['opt-moodgap','moodgap-val',opts.moodGap??2,'mm'],
    ['opt-moonsize','moonsize-val',opts.moonSize??3.5,'mm'],
    ['opt-weathericonsize','weathericonsize-val',opts.weatherIconSize??3.5,'mm'],
    ['opt-cal-numsz','calnumsz-val',opts.calNumSz??6.5,'pt'],
    ['opt-cal-holsz','calholsz-val',opts.calHolSz??4.5,'pt'],
  ];
  rangeFields.forEach(([inpId,spanId,val,unit])=>{
    const inp=$(inpId); if(inp){inp.value=val; $(spanId).textContent=val+unit;}
  });
}

function readOptsFromUI(){
  opts.tnsize=$('opt-tnsize').value;
  opts.paperSize=$('opt-papersize').value;
  opts.customTnW=parseInt($('opt-custom-tn-w').value)||89;
  opts.customTnH=parseInt($('opt-custom-tn-h').value)||124;
  $('custom-tn-row').style.display=opts.tnsize==='custom'?'flex':'none';
  opts.font=$('opt-font').value;
  opts.margin=parseInt($('opt-margin').value);
  opts.checkbox=$('opt-checkbox').value;
  opts.cbsize=parseInt($('opt-cbsize').value);
  opts.linestyle=$('opt-linestyle').value;
  opts.dotgrid=parseInt($('opt-dotgrid').value);
  opts.graphcol=parseFloat($('opt-graphcol').value);
  opts.graphborders=$('opt-graphborders').checked;
  opts.weekstart=$('opt-weekstart').value;
  opts.mood=$('opt-mood').checked;
  opts.moodfaces=parseInt($('opt-moodfaces').value);
  opts.notes=parseInt($('opt-notes').value);
  opts.notespos=$('opt-notespos').value;
  opts.cover=$('opt-cover').checked;
  opts.covertitle=$('opt-covertitle').value;
  opts.coverDesign=$('opt-coverdesign').value;
  opts.backCover=$('opt-backcover').checked;
  opts.coverSheet=$('opt-coversheet').checked;
  opts.backCoverDesign=$('opt-backcoverdesign').value;
  opts.coverAccent=$('opt-coveraccent').value;
  opts.coverFontSize=parseInt($('opt-coverfontsize').value);
  opts.customFont=$('opt-customfont').value;
  opts.calendar=$('opt-calendar').checked;
  opts.calSpread=$('opt-calspread').checked;
  opts.calNumSz=parseFloat($('opt-cal-numsz')?.value)||6.5;
  opts.calHolSz=parseFloat($('opt-cal-holsz')?.value)||4.5;
  opts.cropmarks=$('opt-cropmarks').checked;
  opts.foldline=$('opt-foldline').checked;
  opts.pagenums=$('opt-pagenums').checked;
  opts.printGuide=$('opt-printguide').checked;
  opts.colorIcons=$('opt-coloricons').checked;
  opts.emptyLines=parseInt($('opt-emptylines').value);
  opts.fillPattern=$('opt-fillpattern').value;
  opts.habitMap=$('opt-habitmap').checked;
  opts.goalsPage=$('opt-goalspage').checked;
  opts.moodCal=$('opt-moodcal').checked;
  opts.expenseTracker=$('opt-expenses').checked;
  opts.reflectionPage=$('opt-reflection').checked;
  opts.linkFieldsGraphs=$('opt-linkfg').checked;
  opts.flip=document.querySelector('input[name="flip"]:checked')?.value||'long';
  opts.savePaper=$('opt-savepaper').checked;
  opts.holidays=$('opt-holidays')?.checked||false;
  opts.holidayCountry=$('opt-holidaycountry')?.value||'US';
  opts.holidayState=$('opt-holidaystate')?.value||'';
  opts.moonPhase=$('opt-moonphase').checked;
  opts.weatherIcons=$('opt-weathericons').checked;
  opts.weatherIconSize=parseFloat($('opt-weathericonsize').value)||3.5;
  opts.energyBattery=$('opt-energybattery').checked;
  opts.batterySegs=parseInt($('opt-batterysegs').value)||5;
  opts.batteryStroke=parseFloat($('opt-batterystroke')?.value)||0.4;
  opts.iconSize=parseFloat($('opt-iconsize').value)||5;
  opts.iconGap=parseFloat($('opt-icongap').value)||1.5;
  opts.iconStroke=parseFloat($('opt-iconstroke').value)||1.5;
  opts.fzWeekHdr=parseFloat($('opt-fz-weekhdr').value)||6;
  opts.fzDow=parseFloat($('opt-fz-dow').value)||6;
  opts.fzDayNum=parseFloat($('opt-fz-daynum').value)||18;
  opts.fzHabit=parseFloat($('opt-fz-habit').value)||6;
  opts.fzFieldLbl=parseFloat($('opt-fz-fieldlbl').value)||4.5;
  opts.fzMoodSz=parseFloat($('opt-fz-moodsz').value)||5;
  opts.habRowGap=parseFloat($('opt-habrowgap').value)||1.5;
  opts.moodGap=parseFloat($('opt-moodgap').value)||2;
  opts.moonSize=parseFloat($('opt-moonsize').value)||3.5;
}

function onOptionChange(){
  readOptsFromUI();
  generate();
}

function toggleLink(){
  opts.linkFieldsGraphs=$('opt-linkfg').checked;
  $('metric-section').style.display=opts.linkFieldsGraphs?'none':'';
  if(opts.linkFieldsGraphs){
    graphMetrics=dailyFields.map(f=>({id:f.id,title:f.label,min:null,max:null,step:null}));
    renderMetrics();
  }
  generate();
}

/* ── Import / Export / Reset ── */
function exportSettings(){
  readOptsFromUI();
  const data={habits,bottomBoxes,selectedIcon,selectedDays,opts,graphMetrics,dailyFields,customHolidays,
    month:parseInt($('sel-m').value),year:parseInt($('sel-y').value)};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='tn-weekly-settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSettings(e){
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(){
    try{
      const data=JSON.parse(reader.result);
      if(data.habits) habits=data.habits;
      if(data.bottomBoxes) bottomBoxes=data.bottomBoxes;
      if(data.selectedIcon) selectedIcon=data.selectedIcon;
      if(data.selectedDays) selectedDays=data.selectedDays;
      if(data.opts) opts={...opts,...data.opts};
      if(data.graphMetrics) graphMetrics=data.graphMetrics;
      if(data.dailyFields) dailyFields=data.dailyFields;
      if(data.customHolidays) customHolidays=data.customHolidays;
      if(data.month!=null) $('sel-m').value=data.month;
      if(data.year!=null) $('sel-y').value=data.year;
      applyOptsToUI();
      buildThemeGrid();
      buildColorOverrides();
      renderMetrics();
      renderDailyFields();
      renderHolidays();
      renderHabits();
      renderBottomBoxes();
      buildDayPick();
      generate();
    }catch(err){ alert('Invalid settings file.'); }
  };
  reader.readAsText(file);
  e.target.value='';
}

function resetAll(){
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

/* ══════════════════════════════════════════════
   LUCIDE ICON ELEMENT
   ══════════════════════════════════════════════ */
function lucideEl(name, w, h){
  const s=document.createElement('span');
  s.setAttribute('data-lucide', name);
  s.style.cssText=`width:${w};height:${h};display:block;flex-shrink:0;`;
  return s;
}

/* ══════════════════════════════════════════════
   ICON PICKER
   ══════════════════════════════════════════════ */
function buildIconPicker(){
  if(pickerBuilt) return;
  const panel=$('icon-picker-panel');
  HABIT_ICONS.forEach(name=>{
    const btn=document.createElement('button');
    btn.className='icon-opt';
    btn.title=name;
    btn.appendChild(lucideEl(name,'14px','14px'));
    btn.onclick=e=>{
      e.stopPropagation();
      selectHabitIcon(name);
    };
    panel.appendChild(btn);
  });
  lucide.createIcons();
  pickerBuilt=true;
}

function toggleIconPicker(e){
  e.stopPropagation();
  buildIconPicker();
  $('icon-picker-panel').classList.toggle('open');
}

function selectHabitIcon(name){
  selectedIcon=name; saveState();
  const btn=$('h-icon-btn');
  btn.innerHTML='';
  btn.appendChild(lucideEl(name,'16px','16px'));
  lucide.createIcons();
  $('icon-picker-panel').querySelectorAll('.icon-opt').forEach(b=>{
    b.classList.toggle('selected', b.title===name);
  });
  $('icon-picker-panel').classList.remove('open');
}

document.addEventListener('click',()=>{
  const p=$('icon-picker-panel');
  if(p) p.classList.remove('open');
});

/* ══════════════════════════════════════════════
   DAY PICKER
   ══════════════════════════════════════════════ */
function buildDayPick(){
  const row=$('day-pick');row.innerHTML='';
  const labels=getWdayLabels();
  labels.forEach((lbl,i)=>{
    const dayIdx = opts.weekstart==='sunday' ? i : i;
    const b=el('button','day-btn'+(selectedDays.includes(dayIdx)?' on':''),lbl);
    b.type='button';
    b.onclick=e=>{
      e.stopPropagation();
      if(selectedDays.includes(dayIdx)){
        if(selectedDays.length>1) selectedDays=selectedDays.filter(d=>d!==dayIdx);
      } else {
        selectedDays=[...selectedDays,dayIdx].sort((a,b)=>a-b);
      }
      buildDayPick(); saveState();
    };
    row.appendChild(b);
  });
}

/* ══════════════════════════════════════════════
   HABIT UI
   ══════════════════════════════════════════════ */
function addHabit(){
  const name=$('h-name').value.trim();
  if(!name) return;
  habits.push({icon:selectedIcon,name,days:[...selectedDays],id:Date.now()});
  $('h-name').value='';
  renderHabits(); generate();
}
function removeHabit(id){habits=habits.filter(h=>h.id!==id);renderHabits();generate();}
function toggleHabitDay(id,dayIdx){
  const h=habits.find(h=>h.id===id);if(!h)return;
  if(h.days.includes(dayIdx)){
    if(h.days.length>1) h.days=h.days.filter(d=>d!==dayIdx);
  } else {
    h.days=[...h.days,dayIdx].sort((a,b)=>a-b);
  }
  renderHabits();generate();
}
function renderHabits(){
  const list=$('h-list');list.innerHTML='';
  const labels=getWdayLabels();
  habits.forEach(h=>{
    const item=el('div','h-item');
    const hi=el('span','hi');
    hi.appendChild(lucideEl(h.icon,'16px','16px'));
    item.appendChild(hi);
    item.appendChild(el('span','hn',h.name));
    const days=el('div','h-days');
    labels.forEach((lbl,i)=>{
      const d=el('span','h-day '+(h.days.includes(i)?'on':'off'),lbl);
      d.onclick=()=>toggleHabitDay(h.id,i);
      days.appendChild(d);
    });
    item.appendChild(days);
    const btn=el('button','btn btn-d','x');btn.onclick=()=>removeHabit(h.id);
    item.appendChild(btn);list.appendChild(item);
  });
  lucide.createIcons();
}

/* ── Bottom boxes (add/remove by title) ── */
function addBottomBox(){
  const inp=$('box-title-inp');
  const title=inp.value.trim();
  if(!title) return;
  bottomBoxes.push({title,id:Date.now()});
  inp.value='';
  renderBottomBoxes();generate();
}
function removeBottomBox(id){
  bottomBoxes=bottomBoxes.filter(b=>b.id!==id);
  renderBottomBoxes();generate();
}
function renderBottomBoxes(){
  const list=$('box-list');list.innerHTML='';
  bottomBoxes.forEach(box=>{
    const row=el('div','h-item');
    row.appendChild(el('span','hn',box.title));
    const btn=el('button','btn btn-d','x');btn.onclick=()=>removeBottomBox(box.id);
    row.appendChild(btn);list.appendChild(row);
  });
}

/* ══════════════════════════════════════════════
   WEEK BUILDING (supports Monday or Sunday start)
   ══════════════════════════════════════════════ */
function buildWeeks(y,m){
  const days=daysInMonth(y,m);
  const startOffset = opts.weekstart==='sunday' ? 0 : 1;
  const firstDay = firstDow(y,m);
  const offset = (firstDay - startOffset + 7) % 7;
  const flat=Array(offset).fill(0);
  for(let d=1;d<=days;d++) flat.push(d);
  while(flat.length%7) flat.push(0);
  const weeks=[];
  for(let i=0;i<flat.length;i+=7) weeks.push(flat.slice(i,i+7));
  return weeks;
}

/* ══════════════════════════════════════════════
   STYLE HELPERS
   ══════════════════════════════════════════════ */
function getCheckboxStyle(size){
  const sz=size||opts.cbsize;
  let radius='0';
  if(opts.checkbox==='circle') radius='50%';
  else if(opts.checkbox==='rounded') radius='1.2mm';
  else if(opts.checkbox==='diamond') radius='0';
  let transform='';
  if(opts.checkbox==='diamond') transform='transform:rotate(45deg);';
  return `width:${sz}mm;height:${sz}mm;border-radius:${radius};${transform}`;
}

function getSeparatorStyle(c){
  const colors=c||getColors();
  if(opts.linestyle==='none') return 'border:none;margin:1.5mm 0;';
  return `border:none;border-top:.3pt ${opts.linestyle} ${colors.line};margin:1.5mm 0;`;
}

function getFillStyle(c){
  const colors=c||getColors();
  const g=opts.dotgrid;
  const half=+(g/2).toFixed(1);
  switch(opts.fillPattern){
    case 'dots':
      return `background-image:radial-gradient(circle,${colors.dot} .6px,transparent .6px);background-size:${g}mm ${g}mm;background-position:${half}mm ${half}mm;`;
    case 'lines':
      return `background-image:linear-gradient(to bottom,${colors.dot} 0,${colors.dot} 1px,transparent 1px);background-size:100% ${g}mm;background-position:0 0;`;
    case 'grid':
      return `background-image:linear-gradient(${colors.dot} 1px,transparent 1px),linear-gradient(90deg,${colors.dot} 1px,transparent 1px);background-size:${g}mm ${g}mm;background-position:${half}mm ${half}mm;`;
    case 'hex': {
      const hx=+(g*0.866).toFixed(2);
      return `background-image:radial-gradient(circle,${colors.dot} .6px,transparent .6px),radial-gradient(circle,${colors.dot} .6px,transparent .6px);background-size:${g}mm ${+(2*hx).toFixed(2)}mm;background-position:0 0,${half}mm ${hx}mm;`;
    }
    case 'empty':
    default:
      return 'background-image:none;';
  }
}

function tnSize(){
  if(opts.tnsize==='custom') return {label:'Custom',w:opts.customTnW||89,h:opts.customTnH||124};
  return TN_SIZES[opts.tnsize]||TN_SIZES.passport;
}
function getPaperSize(){ return PAPER_SIZES[opts.paperSize]||PAPER_SIZES.a4; }
function activeFont(){ return opts.customFont.trim()||opts.font||'Georgia'; }
function coverAccent(){ return COVER_ACCENTS[opts.coverAccent]||COVER_ACCENTS.gold; }

function handleImageUpload(inputId, optsKey){
  const inp=document.getElementById(inputId);
  const file=inp.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(){
    opts[optsKey]=reader.result;
    saveState();
    generate();
  };
  reader.readAsDataURL(file);
}
function clearImage(optsKey, inputId){
  opts[optsKey]='';
  if(inputId) document.getElementById(inputId).value='';
  saveState();
  generate();
}

function iconColor(iconName, fallback){
  if(!opts.colorIcons) return fallback||'currentColor';
  return ICON_COLORS[iconName]||fallback||'currentColor';
}

function onRangeChange(inputId, spanId, unit){
  const v=document.getElementById(inputId).value;
  document.getElementById(spanId).textContent=v+unit;
  onOptionChange();
}

const INSPECTOR_MAP=[
  {cls:'d-num',      label:'Day Number',    icon:'hash',          props:[
    {type:'range',    label:'Font size', key:'fzDayNum',  leftId:'opt-fz-daynum',  leftSpan:'fzdaynum-val',  min:10,max:28,step:1,   unit:'pt'},
    {type:'elemColor',label:'Color',    elemKey:'dayNum',    fallback:'line'},
    {type:'elemFont', label:'Font',     elemKey:'dayNum'},
  ]},
  {cls:'d-dow',      label:'Day Name',      icon:'type',          props:[
    {type:'range',    label:'Font size', key:'fzDow',     leftId:'opt-fz-dow',     leftSpan:'fzdow-val',     min:4, max:10,step:0.5, unit:'pt'},
    {type:'elemColor',label:'Color',    elemKey:'dayName',   fallback:'dim'},
    {type:'elemFont', label:'Font',     elemKey:'dayName'},
  ]},
  {cls:'d-moon',     label:'Moon Phase',    icon:'moon',          props:[
    {type:'range',    label:'Size',     key:'moonSize',   leftId:'opt-moonsize',   leftSpan:'moonsize-val',  min:2, max:6, step:0.5, unit:'mm'},
    {type:'elemColor',label:'Color',   elemKey:'moonColor',  fallback:'dim'},
  ]},
  {cls:'sh',         label:'Section Header',icon:'heading-1',     props:[
    {type:'range',    label:'Font size', key:'fzWeekHdr', leftId:'opt-fz-weekhdr', leftSpan:'fzweekhdr-val', min:4, max:12,step:0.5, unit:'pt'},
    {type:'elemColor',label:'Color',    elemKey:'sectionHdr',fallback:'dim'},
    {type:'elemFont', label:'Font',     elemKey:'sectionHdr'},
  ]},
  {cls:'wk-hab-name',label:'Week Habit',    icon:'list',          props:[
    {type:'range',    label:'Name size', key:'fzHabit',   leftId:'opt-fz-habit',   leftSpan:'fzhabit-val',   min:4, max:10,step:0.5, unit:'pt'},
    {type:'range',    label:'Icon size', key:'iconSize',  leftId:'opt-iconsize',   leftSpan:'iconsize-val',   min:2, max:6, step:0.5, unit:'mm'},
    {type:'range',    label:'Stroke',    key:'iconStroke',leftId:'opt-iconstroke', leftSpan:'iconstroke-val', min:0.5,max:3,step:0.25,unit:''},
    {type:'elemFont', label:'Name font', elemKey:'habitName'},
  ]},
  {cls:'d-hab-row',  label:'Habit',        icon:'check-square',  props:[
    {type:'range',  label:'Row gap',   key:'habRowGap', leftId:'opt-habrowgap', leftSpan:'habrowgap-val', min:0.5,max:4, step:0.5, unit:'mm'},
    {type:'select', label:'Checkbox',  key:'checkbox',  leftId:'opt-checkbox',
      options:[['square','Square'],['circle','Circle'],['rounded','Rounded'],['diamond','Diamond']]},
    {type:'range',  label:'Box size',  key:'cbsize',    leftId:'opt-cbsize',   min:3,  max:7, step:1,    unit:'mm'},
    {type:'range',  label:'Icon size', key:'iconSize',  leftId:'opt-iconsize', leftSpan:'iconsize-val',  min:2,  max:6, step:0.5, unit:'mm'},
    {type:'range',  label:'Stroke',    key:'iconStroke',leftId:'opt-iconstroke',leftSpan:'iconstroke-val',min:0.5,max:3,step:0.25,unit:''},
    {type:'range',  label:'Item gap',  key:'iconGap',   leftId:'opt-icongap',  leftSpan:'icongap-val',   min:0,  max:4, step:0.5, unit:'mm'},
    {type:'range',  label:'Name size', key:'fzHabit',   leftId:'opt-fz-habit', leftSpan:'fzhabit-val',   min:4,  max:10,step:0.5, unit:'pt'},
    {type:'elemFont', label:'Name font', elemKey:'habitName'},
  ]},
  {cls:'d-faces',    label:'Mood Icons',    icon:'smile',         props:[
    {type:'range',    label:'Size',    key:'fzMoodSz',   leftId:'opt-fz-moodsz',  leftSpan:'fzmoodsz-val',   min:3, max:8, step:0.5, unit:'mm'},
    {type:'range',    label:'Spacing', key:'moodGap',    leftId:'opt-moodgap',    leftSpan:'moodgap-val',    min:0, max:6, step:0.5, unit:'mm'},
    {type:'range',    label:'Stroke',  key:'iconStroke', leftId:'opt-iconstroke', leftSpan:'iconstroke-val', min:0.5,max:3, step:0.25,unit:''},
    {type:'select',   label:'Faces',   key:'moodfaces',  leftId:'opt-moodfaces',
      options:[['3','3 faces'],['5','5 faces']]},
    {type:'elemColor',label:'Color',   elemKey:'moodIcons', fallback:'dim'},
  ]},
  {cls:'d-field-lbl',label:'Field Label',   icon:'tag',           props:[
    {type:'range',    label:'Font size', key:'fzFieldLbl', leftId:'opt-fz-fieldlbl', leftSpan:'fzfieldlbl-val', min:3,max:8,step:0.5,unit:'pt'},
    {type:'elemColor',label:'Color',    elemKey:'fieldLabel',fallback:'dim'},
    {type:'elemFont', label:'Font',     elemKey:'fieldLabel'},
  ]},
  {cls:'d-weather',  label:'Weather Icons',  icon:'cloud',         props:[
    {type:'range',    label:'Size',     key:'weatherIconSize', leftId:'opt-weathericonsize', leftSpan:'weathericonsize-val', min:3,max:8,step:0.5,unit:'mm'},
    {type:'elemColor',label:'Color',   elemKey:'weatherIcons', fallback:'dim'},
  ]},
  {cls:'d-battery',  label:'Energy Battery', icon:'battery',       props:[
    {type:'range',    label:'Segments', key:'batterySegs',    min:3, max:12, step:1,   unit:''},
    {type:'range',    label:'Stroke',   key:'batteryStroke',  min:0.2, max:1.5, step:0.1, unit:'pt'},
    {type:'elemColor',label:'Color',   elemKey:'batteryColor', fallback:'dim'},
  ]},
  {cls:'d-fill',     label:'Background',    icon:'grid-2x2',      props:[
    {type:'select', label:'Pattern', key:'fillPattern', leftId:'opt-fillpattern',
      options:[['dots','Dots'],['grid','Grid'],['lines','Lines'],['hex','Hex'],['empty','Empty']]},
    {type:'select', label:'Spacing', key:'dotgrid', leftId:'opt-dotgrid',
      options:[['3','3mm'],['4','4mm'],['5','5mm'],['6','6mm']]},
    {type:'color', label:'Dot color',  colorKey:'dot'},
    {type:'color', label:'Line color', colorKey:'line'},
  ]},
  {cls:'cover-title',label:'Cover Title',   icon:'book-open',     props:[
    {type:'select',   label:'Font size', key:'coverFontSize', leftId:'opt-coverfontsize',
      options:[[8,'8pt'],[10,'10pt'],[12,'12pt'],[14,'14pt'],[16,'16pt'],[18,'18pt']]},
    {type:'elemColor',label:'Color',    elemKey:'coverTitle',fallback:'ink'},
    {type:'elemFont', label:'Font',     elemKey:'coverTitle'},
  ]},
];

function buildInspector(entry){
  showInspector();
  $('insp-empty').style.display='none';
  const content=$('insp-content');
  content.style.display='block';

  const hdr=$('insp-header');
  hdr.innerHTML='';
  hdr.appendChild(document.createTextNode(entry.label));

  const propsEl=$('insp-props');
  propsEl.innerHTML='';
  const colors=getColors();

  function appendPalette(row, inp){
    const pal=el('div','color-palette');
    const colors=getColors();
    const mkSw=(c,title)=>{
      const sw=el('button','pal-swatch');
      sw.type='button';sw.style.background=c;sw.title=title||c;
      sw.onclick=e=>{e.stopPropagation();inp.value=c;inp.dispatchEvent(new Event('input'));};
      return sw;
    };
    // Theme colors row
    const themeRow=el('div','pal-row');
    COLOR_VARS.forEach(k=>themeRow.appendChild(mkSw(colors[k],COLOR_LABELS[k])));
    pal.appendChild(themeRow);
    // Custom / per-habit colors row (deduplicated, no theme duplicates)
    const themeSet=new Set(Object.values(colors));
    const customSet=new Set();
    if(opts.colors) Object.values(opts.colors).filter(Boolean).forEach(c=>customSet.add(c));
    if(opts.elementColors) Object.values(opts.elementColors).filter(Boolean).forEach(c=>customSet.add(c));
    habits.forEach(h=>{ if(h.color)customSet.add(h.color); if(h.iconColor)customSet.add(h.iconColor); });
    themeSet.forEach(c=>customSet.delete(c));
    if(customSet.size>0){
      const custRow=el('div','pal-row');
      customSet.forEach(c=>custRow.appendChild(mkSw(c)));
      pal.appendChild(custRow);
    }
    row.appendChild(pal);
  }

  function mkResetBtn(onReset){
    const rb=el('button','insp-reset-btn','↺');
    rb.title='Reset to default';
    rb.onclick=e=>{ e.stopPropagation(); onReset(); };
    return rb;
  }
  function mkLabelRow(label, rb){
    const lr=el('div','insp-label-row');
    lr.appendChild(el('label','insp-lbl',label));
    lr.appendChild(rb);
    return lr;
  }

  entry.props.forEach(prop=>{
    const row=el('div','insp-row');

    if(prop.type==='range'){
      const val=opts[prop.key]??parseFloat(document.getElementById(prop.leftId)?.value)??prop.min;
      const wrap=el('div','range-row');
      const inp=document.createElement('input');
      inp.type='range';inp.min=prop.min;inp.max=prop.max;inp.step=prop.step;inp.value=val;
      const span=el('span','range-val',val+prop.unit);
      inp.oninput=()=>{
        const v=parseFloat(inp.value);
        span.textContent=v+prop.unit;
        opts[prop.key]=v;
        const li=document.getElementById(prop.leftId);
        if(li) li.value=v;
        if(prop.leftSpan) document.getElementById(prop.leftSpan).textContent=v+prop.unit;
        generate();
      };
      const rb=mkResetBtn(()=>{
        const def=OPT_DEFAULTS[prop.key];
        if(def===undefined) return;
        opts[prop.key]=def; inp.value=def; span.textContent=def+prop.unit;
        const li=document.getElementById(prop.leftId);
        if(li) li.value=def;
        if(prop.leftSpan) document.getElementById(prop.leftSpan).textContent=def+prop.unit;
        generate();
      });
      wrap.appendChild(inp);wrap.appendChild(span);
      row.appendChild(mkLabelRow(prop.label,rb));
      row.appendChild(wrap);

    }else if(prop.type==='select'){
      const val=String(opts[prop.key]??document.getElementById(prop.leftId)?.value??prop.options[0][0]);
      const sel=document.createElement('select');
      prop.options.forEach(([v,lbl])=>{
        const o=document.createElement('option');
        o.value=v;o.textContent=lbl;
        if(String(v)===val) o.selected=true;
        sel.appendChild(o);
      });
      sel.onchange=()=>{
        const raw=sel.value;
        const v=isNaN(raw)?raw:(Number.isInteger(+raw)?parseInt(raw):parseFloat(raw));
        opts[prop.key]=v;
        const li=document.getElementById(prop.leftId);
        if(li) li.value=raw;
        generate();
      };
      const rb=mkResetBtn(()=>{
        const def=OPT_DEFAULTS[prop.key];
        if(def===undefined) return;
        opts[prop.key]=def; sel.value=String(def);
        const li=document.getElementById(prop.leftId);
        if(li) li.value=String(def);
        generate();
      });
      row.appendChild(mkLabelRow(prop.label,rb));
      row.appendChild(sel);

    }else if(prop.type==='color'){
      const val=opts.colors[prop.colorKey]||colors[prop.colorKey];
      const inp=document.createElement('input');
      inp.type='color';inp.value=val;
      inp.oninput=()=>{
        opts.colors[prop.colorKey]=inp.value;
        const li=document.querySelector(`#color-overrides input[data-key="${prop.colorKey}"]`);
        if(li) li.value=inp.value;
        generate();
      };
      const rb=mkResetBtn(()=>{
        delete opts.colors[prop.colorKey];
        buildColorOverrides();
        inp.value=getColors()[prop.colorKey];
        generate();
      });
      row.appendChild(mkLabelRow(prop.label,rb));
      row.appendChild(inp);
      appendPalette(row,inp);

    }else if(prop.type==='elemColor'){
      if(!opts.elementColors) opts.elementColors={};
      const themeColor=colors[prop.fallback];
      const val=opts.elementColors[prop.elemKey]||themeColor;
      const inp=document.createElement('input');
      inp.type='color';inp.value=val;
      inp.oninput=()=>{ opts.elementColors[prop.elemKey]=inp.value; generate(); };
      const rb=mkResetBtn(()=>{
        delete opts.elementColors[prop.elemKey];
        inp.value=getColors()[prop.fallback]||themeColor;
        generate();
      });
      row.appendChild(mkLabelRow(prop.label,rb));
      row.appendChild(inp);
      appendPalette(row,inp);

    }else if(prop.type==='elemFont'){
      if(!opts.elementFonts) opts.elementFonts={};
      const themeFont=activeFont();
      const val=opts.elementFonts[prop.elemKey]||'';
      const sel=document.createElement('select');
      sel.className='insp-font-sel';
      ['','Georgia','Times New Roman','Palatino','Garamond','Arial','Helvetica','Verdana','Trebuchet MS','Courier New'].forEach(f=>{
        const o=document.createElement('option');
        o.value=f;o.textContent=f||`Theme (${themeFont})`;
        if(f===val) o.selected=true;
        sel.appendChild(o);
      });
      sel.onchange=()=>{ opts.elementFonts[prop.elemKey]=sel.value; generate(); };
      const rb=mkResetBtn(()=>{
        delete opts.elementFonts[prop.elemKey];
        sel.value='';
        generate();
      });
      row.appendChild(mkLabelRow(prop.label,rb));
      row.appendChild(sel);
    }

    propsEl.appendChild(row);
  });

  // Habit data editor
  if(inspectorContext.habitId!==null){
    const h=habits.find(x=>x.id===inspectorContext.habitId);
    if(h){
      const sep=el('hr','insp-sep');
      propsEl.appendChild(sep);
      const nameRow=el('div','insp-row');
      nameRow.appendChild(el('label','insp-lbl','Name'));
      const nameInp=document.createElement('input');
      nameInp.type='text';nameInp.value=h.name;nameInp.className='insp-text-inp';
      nameInp.oninput=()=>{ h.name=nameInp.value; renderHabits(); generate(); };
      nameRow.appendChild(nameInp);
      propsEl.appendChild(nameRow);
      const iconLbl=el('div','insp-row');
      iconLbl.appendChild(el('label','insp-lbl','Icon'));
      propsEl.appendChild(iconLbl);
      const iconGrid=el('div','insp-icon-grid');
      HABIT_ICONS.forEach(icon=>{
        const btn=el('button','insp-icon-btn'+(h.icon===icon?' active':''));
        btn.type='button';btn.title=icon;
        btn.appendChild(lucideEl(icon,'12px','12px'));
        btn.onclick=()=>{
          h.icon=icon;
          iconGrid.querySelectorAll('.insp-icon-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          renderHabits();generate();
          lucide.createIcons({el:iconGrid});
        };
        iconGrid.appendChild(btn);
      });
      lucide.createIcons({el:iconGrid});
      propsEl.appendChild(iconGrid);

      // Per-habit color / font
      const hSep=el('hr','insp-sep');
      propsEl.appendChild(hSep);
      const hSectionLbl=el('div','insp-habit-section-lbl','This habit');
      propsEl.appendChild(hSectionLbl);

      function mkHabitColorRow(label, getter, setter, resetFallback){
        const r=el('div','insp-row');
        const rb=mkResetBtn(()=>{ setter(null); ci.value=resetFallback; renderHabits(); generate(); });
        r.appendChild(mkLabelRow(label,rb));
        const ci=document.createElement('input');
        ci.type='color'; ci.value=getter()||resetFallback;
        ci.oninput=()=>{ setter(ci.value); renderHabits(); generate(); };
        r.appendChild(ci);
        appendPalette(r,ci);
        return r;
      }

      propsEl.appendChild(mkHabitColorRow(
        'Icon color',
        ()=>h.iconColor||null,
        v=>{ if(v)h.iconColor=v; else delete h.iconColor; },
        getElemColor('habitIcon', iconColor(h.icon, colors.dim))
      ));
      propsEl.appendChild(mkHabitColorRow(
        'Name color',
        ()=>h.color||null,
        v=>{ if(v)h.color=v; else delete h.color; },
        getElemColor('habitName', colors.ink)
      ));

      const fontRow=el('div','insp-row');
      const fontSel=document.createElement('select');
      fontSel.className='insp-font-sel';
      ['','Georgia','Times New Roman','Palatino','Garamond','Arial','Helvetica','Verdana','Trebuchet MS','Courier New'].forEach(f=>{
        const o=document.createElement('option');
        o.value=f; o.textContent=f||`Theme (${activeFont()})`;
        if(f===(h.font||'')) o.selected=true;
        fontSel.appendChild(o);
      });
      fontSel.onchange=()=>{ if(fontSel.value) h.font=fontSel.value; else delete h.font; renderHabits(); generate(); };
      const fontRb=mkResetBtn(()=>{ delete h.font; fontSel.value=''; renderHabits(); generate(); });
      fontRow.appendChild(mkLabelRow('Name font',fontRb));
      fontRow.appendChild(fontSel);
      propsEl.appendChild(fontRow);
    }
  }

  // Field data editor
  if(inspectorContext.fieldId!==null){
    const f=dailyFields.find(x=>x.id===inspectorContext.fieldId);
    if(f){
      const sep=el('hr','insp-sep');
      propsEl.appendChild(sep);
      const nameRow=el('div','insp-row');
      nameRow.appendChild(el('label','insp-lbl','Label'));
      const nameInp=document.createElement('input');
      nameInp.type='text';nameInp.value=f.label;nameInp.className='insp-text-inp';
      nameInp.oninput=()=>{ f.label=nameInp.value; renderDailyFields(); generate(); };
      nameRow.appendChild(nameInp);
      propsEl.appendChild(nameRow);
    }
  }
}

function showMobileInspector(){
  document.getElementById('inspector').classList.add('insp-open');
}
function closeMobileInspector(){
  document.getElementById('inspector').classList.remove('insp-open');
}
function showInspector(){
  document.getElementById('inspector').classList.remove('insp-hidden');
}
function closeInspector(){
  document.getElementById('inspector').classList.add('insp-hidden');
  $('insp-content').style.display='none';
  $('insp-empty').style.display='flex';
}

function getPagePadding(){
  const m=opts.margin;
  const side=m+1;
  return `padding:${m}mm ${side}mm;`;
}

/* ══════════════════════════════════════════════
   GRAPH SVG
   ══════════════════════════════════════════════ */
function buildGraphSVG(days, metric, colors, yr, mo, graphW){
  const c=colors||getColors();
  const title = typeof metric==='string' ? metric : metric.title;
  const hasRange = typeof metric!=='string' && metric.min!=null && metric.max!=null && metric.step!=null && metric.step>0 && metric.max>metric.min;
  const colW=opts.graphcol;
  const titleW=4, lblW=4;
  const headerH = hasRange ? 4 : 0;
  const plotW= graphW ? +(graphW - titleW - lblW).toFixed(2) : Math.max(10, Math.floor(28/colW)*colW);
  const nCols=Math.round(plotW/colW);
  const W=+(titleW+plotW+lblW).toFixed(2);
  const plotX=titleW;
  const contentH=tnSize().h - 2*opts.margin - 8;
  const rowH=+((contentH/days)).toFixed(3), H=+(days*rowH).toFixed(2);
  const totalH=+(H+headerH).toFixed(2);

  const startDow = opts.weekstart==='sunday' ? 0 : 1;
  const fd = new Date(yr, mo, 1).getDay();
  const weekStarts = new Set();
  for(let d=2;d<=days;d++){
    if((fd+d-1)%7===startDow) weekStarts.add(d);
  }

  let s=`<svg width="100%" height="100%" viewBox="0 0 ${W} ${totalH}" preserveAspectRatio="none">`;

  // Value axis header
  if(hasRange){
    const {min,max,step}=metric;
    s+=`<line x1="${plotX}" y1="${headerH}" x2="${plotX+plotW}" y2="${headerH}" stroke="${c.dim}" stroke-width=".4"/>`;
    const numSteps=Math.round((max-min)/step);
    for(let i=0;i<=numSteps;i++){
      const v=+(min+i*step).toFixed(8);
      if(v>max+step*0.001) break;
      const xRatio=(v-min)/(max-min);
      const lx=+(plotX+xRatio*plotW).toFixed(2);
      s+=`<line x1="${lx}" y1="${headerH-1}" x2="${lx}" y2="${headerH}" stroke="${c.dim}" stroke-width=".3"/>`;
      s+=`<text x="${lx}" y="${+(headerH/2).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="2.8" fill="${c.dim}">${v%1===0?v:v.toFixed(1)}</text>`;
    }
  }

  const tc=+(titleW/2).toFixed(1);
  s+=`<text transform="rotate(-90,${tc},${totalH})" x="${tc}" y="${totalH}"
    text-anchor="start" dominant-baseline="middle"
    font-size="3" font-weight="700" letter-spacing=".5"
    fill="${c.dim}">${title.toUpperCase()}</text>`;

  for(let col=0;col<=nCols;col++){
    const x=+(plotX+col*colW).toFixed(2);
    const isEdge=col===0||col===nCols;
    s+=`<line x1="${x}" y1="${headerH}" x2="${x}" y2="${totalH}" stroke="${isEdge?c.dim:c.line}" stroke-width="${isEdge?'.4':'.2'}"/>`;
  }

  for(let d=1;d<=days;d++){
    const yy=+(totalH-d*rowH).toFixed(2);
    const isWk=weekStarts.has(d);
    s+=`<line x1="${plotX}" y1="${yy}" x2="${plotX+plotW}" y2="${yy}" stroke="${isWk?c.dim:c.line}" stroke-width="${isWk?'.45':'.2'}" ${isWk?'stroke-dasharray="1.5,1"':''}/>`;

    const showLabel = d===1 || isWk || (d===days && !weekStarts.has(d));
    if(showLabel){
      const cy=+(totalH-(d-.5)*rowH).toFixed(2);
      const lx=+(plotX+plotW+lblW/2).toFixed(1);
      s+=`<text transform="rotate(-90,${lx},${cy})" x="${lx}" y="${cy}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="3.5" fill="${c.dim}">${d}</text>`;
    }
  }

  if(opts.graphborders){
    s+=`<line x1="${plotX}" y1="${headerH}" x2="${plotX+plotW}" y2="${headerH}" stroke="${c.dim}" stroke-width=".4"/>`;
    s+=`<line x1="${plotX}" y1="${totalH}" x2="${plotX+plotW}" y2="${totalH}" stroke="${c.dim}" stroke-width=".4"/>`;
  }

  s+=`</svg>`;
  return s;
}

/* ══════════════════════════════════════════════
   PAGE BUILDERS
   ══════════════════════════════════════════════ */
function pg(lbl,c){
  const colors=c||getColors();
  const p=el('div','pg');
  p.dataset.lbl=lbl;
  const sz=tnSize();
  p.style.cssText=`--pg-ink:${colors.ink};--pg-dim:${colors.dim};--pg-line:${colors.line};--pg-dot:${colors.dot};--pg-page:${colors.page};width:${sz.w}mm;height:${sz.h}mm;background-color:${colors.page};font-family:'${activeFont()}',serif;${getPagePadding()}`;
  return p;
}

function mkCoverTitle(cls,style,titleText){
  const wrap=el('div',cls);
  wrap.style.cssText=style;
  titleText.split('\n').forEach(line=>{
    wrap.appendChild(el('div','',line));
  });
  return wrap;
}

function mkCover(y,m,c){
  const colors=c||getColors();
  const p=pg('cover',colors);
  p.classList.add('cover-pg');
  const titleText=opts.covertitle||'My Journal';
  const sub=`${MONTHS[m]} ${y}`;
  const fz=opts.coverFontSize||12;
  const acc=coverAccent();

  if(opts.coverDesign==='custom' && opts.coverImage){
    p.style.cssText+=`background-image:url(${opts.coverImage});background-size:cover;background-position:center;`;
    const overlay=el('div','');
    overlay.style.cssText=`position:absolute;inset:0;background:rgba(0,0,0,.35);`;
    p.appendChild(overlay);
    p.appendChild(mkCoverTitle('cover-title',`color:#fff;font-size:${fz}pt;position:relative;z-index:1;text-shadow:0 1px 4px rgba(0,0,0,.6);`,titleText));
    const cs=el('div','cover-subtitle',sub);
    cs.style.cssText=`color:rgba(255,255,255,.8);position:relative;z-index:1;`;
    p.appendChild(cs);
    return p;
  }

  switch(opts.coverDesign){
    case 'simple':
      p.style.cssText+=getFillStyle(colors);
      p.appendChild(mkCoverTitle('cover-title',`color:${getElemColor('coverTitle',colors.ink)};font-size:${fz}pt;`,titleText));
      const ss=el('div','cover-subtitle',sub);
      ss.style.color=colors.dim;
      p.appendChild(ss);
      break;
    case 'minimal': {
      const wrap=el('div','');
      wrap.style.cssText=`position:absolute;bottom:${opts.margin+2}mm;left:${opts.margin+2}mm;`;
      wrap.appendChild(mkCoverTitle('',`font-size:${Math.max(8,fz-1)}pt;font-weight:700;color:${colors.ink};letter-spacing:.04em;`,titleText));
      const ms=el('div','',sub);
      ms.style.cssText=`font-size:6pt;text-transform:uppercase;letter-spacing:.12em;color:${colors.dim};margin-top:1mm;`;
      wrap.appendChild(ms);
      p.appendChild(wrap);
      const line=el('div','');
      line.style.cssText=`position:absolute;bottom:${opts.margin+1}mm;left:${opts.margin+2}mm;right:${opts.margin+2}mm;border-bottom:.5pt solid ${colors.line};`;
      p.appendChild(line);
      break;
    }
    case 'banner': {
      p.style.cssText+=getFillStyle(colors);
      const band=el('div','');
      band.style.cssText=`position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);background:${colors.page};padding:5mm ${opts.margin+2}mm;border-top:.6pt solid ${colors.line};border-bottom:.6pt solid ${colors.line};text-align:center;`;
      band.appendChild(mkCoverTitle('',`font-size:${fz+1}pt;font-weight:700;color:${colors.ink};letter-spacing:.06em;`,titleText));
      const bs=el('div','',sub);
      bs.style.cssText=`font-size:6pt;text-transform:uppercase;letter-spacing:.12em;color:${colors.dim};margin-top:1.5mm;`;
      band.appendChild(bs);
      p.appendChild(band);
      break;
    }
    case 'vintage': {
      const gold=acc.main, goldDim=acc.dim;
      p.style.backgroundColor=colors.ink;
      const vo=el('div','');
      vo.style.cssText=`position:absolute;top:3mm;left:3mm;right:3mm;bottom:3mm;border:.5pt solid ${gold};`;
      p.appendChild(vo);
      const vi=el('div','');
      vi.style.cssText=`position:absolute;top:5mm;left:5mm;right:5mm;bottom:5mm;border:.3pt solid ${gold};`;
      p.appendChild(vi);
      const cornerSvg=`<svg viewBox="0 0 30 30" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M2,28 L2,8 C2,4 4,2 8,2 L28,2" fill="none" stroke="${gold}" stroke-width=".7"/>
        <path d="M5,25 L5,10 C5,7 7,5 10,5 L25,5" fill="none" stroke="${gold}" stroke-width=".4"/>
        <path d="M2,20 C6,20 8,18 8,14" fill="none" stroke="${gold}" stroke-width=".35"/>
        <path d="M20,2 C20,6 18,8 14,8" fill="none" stroke="${gold}" stroke-width=".35"/>
        <circle cx="8" cy="8" r="1.2" fill="${gold}"/>
        <circle cx="4" cy="4" r=".6" fill="${gold}"/>
        <path d="M10,2.5 C10,5 8.5,6 6,6" fill="none" stroke="${gold}" stroke-width=".25"/>
        <path d="M2.5,10 C5,10 6,8.5 6,6" fill="none" stroke="${gold}" stroke-width=".25"/>
      </svg>`;
      [{t:'3mm',l:'3mm',s:''},{t:'3mm',r:'3mm',s:'scaleX(-1)'},{b:'3mm',l:'3mm',s:'scaleY(-1)'},{b:'3mm',r:'3mm',s:'scale(-1)'}].forEach(pos=>{
        const c=el('div','');
        let css='position:absolute;width:12mm;height:12mm;';
        if(pos.t)css+=`top:${pos.t};`;if(pos.b)css+=`bottom:${pos.b};`;
        if(pos.l)css+=`left:${pos.l};`;if(pos.r)css+=`right:${pos.r};`;
        if(pos.s)css+=`transform:${pos.s};`;
        c.style.cssText=css;c.innerHTML=cornerSvg;p.appendChild(c);
      });
      const ornSvg=`<svg viewBox="0 0 60 14" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,7 C6,7 10,2 18,2 C22,2 26,5 30,7 C34,5 38,2 42,2 C50,2 54,7 60,7" fill="none" stroke="${gold}" stroke-width=".5"/>
        <path d="M0,7 C6,7 10,12 18,12 C22,12 26,9 30,7 C34,9 38,12 42,12 C50,12 54,7 60,7" fill="none" stroke="${gold}" stroke-width=".5"/>
        <circle cx="30" cy="7" r="1.8" fill="none" stroke="${gold}" stroke-width=".5"/>
        <circle cx="30" cy="7" r=".8" fill="${gold}"/>
        <circle cx="18" cy="7" r=".5" fill="${gold}"/>
        <circle cx="42" cy="7" r=".5" fill="${gold}"/>
      </svg>`;
      const topO=el('div','');
      topO.style.cssText=`position:absolute;top:16mm;left:50%;transform:translateX(-50%);width:30mm;height:7mm;`;
      topO.innerHTML=ornSvg;p.appendChild(topO);
      const botO=el('div','');
      botO.style.cssText=`position:absolute;bottom:16mm;left:50%;transform:translateX(-50%) rotate(180deg);width:30mm;height:7mm;`;
      botO.innerHTML=ornSvg;p.appendChild(botO);
      const sideH=`position:absolute;left:50%;transform:translateX(-50%);width:20mm;border-bottom:.3pt solid ${goldDim};`;
      const sl1=el('div','');sl1.style.cssText=sideH+`top:25mm;`;p.appendChild(sl1);
      const sl2=el('div','');sl2.style.cssText=sideH+`bottom:25mm;`;p.appendChild(sl2);
      const tw=el('div','');
      tw.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;width:80%;`;
      const da=el('div','');
      da.style.cssText=`display:flex;align-items:center;justify-content:center;gap:2mm;margin-bottom:3mm;`;
      da.innerHTML=`<span style="flex:1;border-bottom:.3pt solid ${goldDim};"></span><span style="color:${gold};font-size:5pt;">&#10022;</span><span style="flex:1;border-bottom:.3pt solid ${goldDim};"></span>`;
      tw.appendChild(da);
      titleText.split('\n').forEach(line=>{
        const t=el('div','',line);
        t.style.cssText=`font-size:${fz}pt;font-weight:700;color:${gold};letter-spacing:.08em;line-height:1.4;`;
        tw.appendChild(t);
      });
      const db=el('div','');
      db.style.cssText=`display:flex;align-items:center;justify-content:center;gap:2mm;margin-top:3mm;`;
      db.innerHTML=da.innerHTML;
      tw.appendChild(db);
      const vs=el('div','',sub);
      vs.style.cssText=`font-size:6pt;text-transform:uppercase;letter-spacing:.15em;color:${goldDim};margin-top:2.5mm;`;
      tw.appendChild(vs);
      p.appendChild(tw);
      break;
    }
    case 'framed':
    default: {
      p.style.cssText+=getFillStyle(colors);
      const border=el('div','cover-border');
      border.style.borderColor=colors.line;
      p.appendChild(border);
      const inner=el('div','cover-inner-border');
      inner.style.borderColor=colors.line;
      p.appendChild(inner);
      p.appendChild(mkCoverTitle('cover-title',`color:${getElemColor('coverTitle',colors.ink)};font-size:${fz+2}pt;`,titleText));
      const fs=el('div','cover-subtitle',sub);
      fs.style.color=colors.dim;
      p.appendChild(fs);
      break;
    }
  }
  return p;
}

function mkBackCover(y,m,c){
  const colors=c||getColors();
  const p=pg('back-cover',colors);
  p.classList.add('cover-pg');
  const sub=`${MONTHS[m]} ${y}`;
  const acc=coverAccent();
  const design=opts.backCoverDesign||'simple';

  if(design==='custom' && opts.backCoverImage){
    p.style.cssText+=`background-image:url(${opts.backCoverImage});background-size:cover;background-position:center;`;
    return p;
  }

  switch(design){
    case 'framed': {
      p.style.cssText+=getFillStyle(colors);
      const bo=el('div','cover-border');
      bo.style.borderColor=colors.line;
      p.appendChild(bo);
      const bi=el('div','cover-inner-border');
      bi.style.borderColor=colors.line;
      p.appendChild(bi);
      const info=el('div','');
      info.style.cssText=`position:absolute;bottom:${opts.margin+4}mm;left:50%;transform:translateX(-50%);font-size:5pt;color:${colors.dot};text-transform:uppercase;letter-spacing:.12em;`;
      info.textContent=sub;
      p.appendChild(info);
      break;
    }
    case 'minimal': {
      const line=el('div','');
      line.style.cssText=`position:absolute;bottom:${opts.margin+1}mm;left:${opts.margin+2}mm;right:${opts.margin+2}mm;border-bottom:.5pt solid ${colors.line};`;
      p.appendChild(line);
      const info=el('div','');
      info.style.cssText=`position:absolute;bottom:${opts.margin+2.5}mm;right:${opts.margin+2}mm;font-size:5pt;color:${colors.dim};`;
      info.textContent=sub;
      p.appendChild(info);
      break;
    }
    case 'banner': {
      p.style.cssText+=getFillStyle(colors);
      const band=el('div','');
      band.style.cssText=`position:absolute;left:0;right:0;bottom:0;background:${colors.page};padding:4mm ${opts.margin+2}mm;border-top:.6pt solid ${colors.line};text-align:center;`;
      const bs=el('div','',sub);
      bs.style.cssText=`font-size:5pt;text-transform:uppercase;letter-spacing:.12em;color:${colors.dim};`;
      band.appendChild(bs);
      p.appendChild(band);
      break;
    }
    case 'vintage': {
      const gold=acc.main, goldDim=acc.dim;
      p.style.backgroundColor=colors.ink;
      const vo=el('div','');
      vo.style.cssText=`position:absolute;top:3mm;left:3mm;right:3mm;bottom:3mm;border:.5pt solid ${gold};`;
      p.appendChild(vo);
      const vi=el('div','');
      vi.style.cssText=`position:absolute;top:5mm;left:5mm;right:5mm;bottom:5mm;border:.3pt solid ${gold};`;
      p.appendChild(vi);
      const cornerSvg=`<svg viewBox="0 0 30 30" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M2,28 L2,8 C2,4 4,2 8,2 L28,2" fill="none" stroke="${gold}" stroke-width=".7"/>
        <path d="M5,25 L5,10 C5,7 7,5 10,5 L25,5" fill="none" stroke="${gold}" stroke-width=".4"/>
        <path d="M2,20 C6,20 8,18 8,14" fill="none" stroke="${gold}" stroke-width=".35"/>
        <path d="M20,2 C20,6 18,8 14,8" fill="none" stroke="${gold}" stroke-width=".35"/>
        <circle cx="8" cy="8" r="1.2" fill="${gold}"/>
        <circle cx="4" cy="4" r=".6" fill="${gold}"/>
        <path d="M10,2.5 C10,5 8.5,6 6,6" fill="none" stroke="${gold}" stroke-width=".25"/>
        <path d="M2.5,10 C5,10 6,8.5 6,6" fill="none" stroke="${gold}" stroke-width=".25"/>
      </svg>`;
      [{t:'3mm',l:'3mm',s:''},{t:'3mm',r:'3mm',s:'scaleX(-1)'},{b:'3mm',l:'3mm',s:'scaleY(-1)'},{b:'3mm',r:'3mm',s:'scale(-1)'}].forEach(pos=>{
        const cn=el('div','');
        let css='position:absolute;width:12mm;height:12mm;';
        if(pos.t)css+=`top:${pos.t};`;if(pos.b)css+=`bottom:${pos.b};`;
        if(pos.l)css+=`left:${pos.l};`;if(pos.r)css+=`right:${pos.r};`;
        if(pos.s)css+=`transform:${pos.s};`;
        cn.style.cssText=css;cn.innerHTML=cornerSvg;p.appendChild(cn);
      });
      const ornSvg=`<svg viewBox="0 0 60 14" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,7 C6,7 10,2 18,2 C22,2 26,5 30,7 C34,5 38,2 42,2 C50,2 54,7 60,7" fill="none" stroke="${gold}" stroke-width=".5"/>
        <path d="M0,7 C6,7 10,12 18,12 C22,12 26,9 30,7 C34,9 38,12 42,12 C50,12 54,7 60,7" fill="none" stroke="${gold}" stroke-width=".5"/>
        <circle cx="30" cy="7" r="1.8" fill="none" stroke="${gold}" stroke-width=".5"/>
        <circle cx="30" cy="7" r=".8" fill="${gold}"/>
      </svg>`;
      const orn=el('div','');
      orn.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24mm;height:6mm;`;
      orn.innerHTML=ornSvg;
      p.appendChild(orn);
      const info=el('div','');
      info.style.cssText=`position:absolute;bottom:8mm;left:50%;transform:translateX(-50%);font-size:4.5pt;color:${goldDim};text-transform:uppercase;letter-spacing:.15em;`;
      info.textContent=sub;
      p.appendChild(info);
      break;
    }
    case 'simple':
    default: {
      p.style.cssText+=getFillStyle(colors);
      const line=el('div','');
      line.style.cssText=`position:absolute;top:50%;left:${opts.margin+4}mm;right:${opts.margin+4}mm;border-bottom:.4pt solid ${colors.line};`;
      p.appendChild(line);
      const dot=el('div','');
      dot.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2mm;height:2mm;border-radius:50%;background:${colors.dot};`;
      p.appendChild(dot);
      const info=el('div','');
      info.style.cssText=`position:absolute;bottom:${opts.margin+2}mm;right:${opts.margin+2}mm;font-size:4.5pt;color:${colors.dot};text-align:right;`;
      info.textContent=sub;
      p.appendChild(info);
      break;
    }
  }
  return p;
}

/* ── MONTHLY PAGE BUILDERS ── */

function mkHabitMap(y,m,c){
  const colors=c||getColors();
  const p=pg('habit-map',colors);
  p.classList.add('fcol');

  const sz=tnSize();
  const margin=opts.margin;
  const side=margin+1;
  const contentW=sz.w-2*side;
  const contentH=sz.h-2*margin;
  const days=daysInMonth(y,m);
  const habList=habits.length>0?habits:[{icon:'star',name:'Habit 1',days:[0,1,2,3,4,5,6]},{icon:'droplets',name:'Habit 2',days:[0,1,2,3,4,5,6]}];
  const nHabs=Math.min(habList.length,8);
  const font=activeFont();

  // Header
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — Circle Habit Tracker`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};font-size:5pt;`;
  p.appendChild(hdr);

  // Layout budget
  const legendH=20;
  const headerEst=6;
  const svgH=contentH-headerEst-legendH-3;
  const svgW=contentW;

  // Circle geometry — shifted right so upper-left gap has room for labels
  const cx=svgW*0.55;
  const cy=svgH*0.50;
  const outerR=Math.min(cx,cy,svgW-cx,svgH-cy)*0.96;
  const dayRingT=Math.max(3.5,outerR*0.13);
  const dayInnerR=outerR-dayRingT;
  const centerR=Math.max(7,outerR*0.28);
  const habRingT=nHabs>0?(dayInnerR-centerR)/nHabs:4;

  // Arc: 270° total — day 1 at top (0° AFTC), clockwise, ends at left (270° AFTC)
  // Gap: 270°→360° (upper-left) — habit labels live here
  const dayArc=270/days;

  // AFTC = clockwise from top; toRad converts to SVG math angle
  const toRad=a=>(a-90)*Math.PI/180;
  const px=(r,a)=>+(cx+r*Math.cos(toRad(a))).toFixed(3);
  const py=(r,a)=>+(cy+r*Math.sin(toRad(a))).toFixed(3);

  // Filled ring segment path (r1=inner, r2=outer, angles AFTC clockwise)
  function seg(r1,r2,a1,a2){
    const laf=(a2-a1)>180?1:0;
    return `M ${px(r2,a1)} ${py(r2,a1)} A ${r2} ${r2} 0 ${laf} 1 ${px(r2,a2)} ${py(r2,a2)} L ${px(r1,a2)} ${py(r1,a2)} A ${r1} ${r1} 0 ${laf} 0 ${px(r1,a1)} ${py(r1,a1)} Z`;
  }

  const acc=colors.acc||colors.dim;
  let svg=`<svg width="${svgW}mm" height="${svgH}mm" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;display:block;">`;

  // ── 1. Habit ring arc cells (fill only, no stroke — full circles drawn separately)
  for(let h=0;h<nHabs;h++){
    const rO=dayInnerR-h*habRingT;
    const rI=rO-habRingT;
    svg+=`<path d="${seg(rI,rO,0,270)}" fill="${colors.page}" stroke="none"/>`;
    // Day dividers within arc
    for(let d=0;d<=days;d++){
      const a=d*dayArc;
      svg+=`<line x1="${px(rI,a)}" y1="${py(rI,a)}" x2="${px(rO,a)}" y2="${py(rO,a)}" stroke="${colors.line}" stroke-width="0.2"/>`;
    }
  }

  // ── 2. Day ring arc cells (accent fill, no stroke)
  for(let d=1;d<=days;d++){
    const a1=(d-1)*dayArc;
    const a2=d*dayArc;
    const isWe=[0,6].includes(dow(y,m,d));
    svg+=`<path d="${seg(dayInnerR,outerR,a1,a2)}" fill="${isWe?acc+'20':acc+'40'}" stroke="none"/>`;
  }

  // ── 3. Arc-only boundary strokes (0°–270°, no full circle)
  svg+=`<path d="${seg(dayInnerR,outerR,0,270)}" fill="none" stroke="${colors.line}" stroke-width="0.3"/>`;
  for(let h=0;h<nHabs;h++){
    const rO=dayInnerR-h*habRingT;
    const rI=rO-habRingT;
    svg+=`<path d="${seg(rI,rO,0,270)}" fill="none" stroke="${colors.line}" stroke-width="0.25"/>`;
  }
  svg+=`<path d="${seg(0,centerR,0,270)}" fill="none" stroke="${colors.line}" stroke-width="0.25"/>`;

  // ── 4. Day numbers (after fill so they render on top)
  for(let d=1;d<=days;d++){
    const a1=(d-1)*dayArc;
    const a2=d*dayArc;
    const ma=(a1+a2)/2;
    const tr=(dayInnerR+outerR)/2;
    const rot=(ma-90).toFixed(1);
    const fs=Math.min(3.2,dayArc*0.42);
    svg+=`<text x="${px(tr,ma)}" y="${py(tr,ma)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" font-family="${font},serif" fill="${colors.ink}" transform="rotate(${rot},${px(tr,ma)},${py(tr,ma)})">${d}</text>`;
  }

  // ── 5. Center month name
  const cfs=+(Math.min(8,centerR*0.6)).toFixed(1);
  svg+=`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${cfs}" font-weight="700" letter-spacing="0.8" font-family="${font},serif" fill="${colors.dim}">${MONTHS[m].toUpperCase()}</text>`;

  // ── 6. Habit writing lines in gap (upper-left, 270°–360°)
  // Each ring gets a solid horizontal writing line from left edge to its outer
  // circle boundary at 315° — no text, user writes habit name after printing.
  // Full circles already drawn so line tip visibly touches the correct ring circle.
  for(let h=0;h<nHabs;h++){
    const rO=+(dayInnerR-h*habRingT).toFixed(3);
    const rI=+(dayInnerR-(h+1)*habRingT).toFixed(3);
    const rMid=+((rO+rI)/2).toFixed(3);
    // Lines at BOTTOM of ring band at angle 0° (inner boundary = bottom of box at top of circle)
    const yLine=+(cy-rI).toFixed(3);
    const xTip=+cx.toFixed(3);
    svg+=`<line x1="0.5" y1="${yLine}" x2="${xTip}" y2="${yLine}" stroke="${colors.dim}" stroke-width="0.25"/>`;
    // Habit name label centered in ring band
    if(habits[h]){
      const yText=+(cy-rMid).toFixed(3);
      const fs=+(Math.max(2,Math.min(3.5,habRingT*0.55))).toFixed(1);
      svg+=`<text x="1" y="${yText}" dominant-baseline="middle" font-size="${fs}" font-family="${font},sans-serif" fill="${colors.ink}">${habits[h].name}</text>`;
    }
  }

  svg+=`</svg>`;

  const svgWrap=el('div','');
  svgWrap.style.cssText=`flex:1;display:flex;align-items:center;`;
  svgWrap.innerHTML=svg;
  p.appendChild(svgWrap);

  // ── Custom boxes at bottom
  if(bottomBoxes.length>0){
    const lgd=el('div','');
    lgd.style.cssText=`display:flex;gap:2mm;flex-shrink:0;height:${legendH}mm;`;
    bottomBoxes.forEach(boxDef=>{
      const box=el('div','');
      box.style.cssText=`flex:1;border:.3pt solid ${colors.line};padding:1.5mm;display:flex;flex-direction:column;overflow:hidden;`;
      const lbl=el('div','',boxDef.title);
      lbl.style.cssText=`font-size:3.5pt;font-weight:700;color:${colors.dim};letter-spacing:.5px;margin-bottom:1mm;flex-shrink:0;`;
      box.appendChild(lbl);
      for(let i=0;i<5;i++){
        const ln=el('div','');
        ln.style.cssText=`flex:1;border-bottom:.25pt solid ${colors.line};`;
        box.appendChild(ln);
      }
      lgd.appendChild(box);
    });
    p.appendChild(lgd);
  }
  return p;
}

function mkGoalsPage(y,m,c){
  const colors=c||getColors();
  const p=pg('goals',colors);
  p.classList.add('fcol');
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — Goals`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const goals=el('div','');
  goals.style.cssText='display:flex;flex-direction:column;gap:2mm;flex:1;';
  for(let i=0;i<5;i++){
    const goal=el('div','');
    goal.style.cssText=`padding:1.5mm 0;${i<4?'border-bottom:.3pt solid '+colors.line+';':''}`;
    const row=el('div','');
    row.style.cssText=`display:flex;align-items:center;gap:1.5mm;margin-bottom:1.5mm;`;
    const num=el('span','',`${i+1}.`);
    num.style.cssText=`font-size:7pt;font-weight:700;color:${colors.dim};min-width:3mm;`;
    row.appendChild(num);
    const box=el('div','');
    box.style.cssText=`width:3.5mm;height:3.5mm;border:.4pt solid ${colors.dim};flex-shrink:0;${getCheckboxStyle(3.5)}`;
    row.appendChild(box);
    const line=el('div','');
    line.style.cssText=`flex:1;border-bottom:.3pt solid ${colors.dim};height:3mm;`;
    row.appendChild(line);
    goal.appendChild(row);
    for(let a=0;a<2;a++){
      const step=el('div','');
      step.style.cssText=`display:flex;align-items:center;gap:1mm;margin-left:6mm;margin-bottom:1mm;`;
      const bullet=el('span','','·');
      bullet.style.cssText=`font-size:6pt;color:${colors.dot};`;
      step.appendChild(bullet);
      const sl=el('div','');
      sl.style.cssText=`flex:1;border-bottom:.2pt dotted ${colors.line};height:2.5mm;`;
      step.appendChild(sl);
      goal.appendChild(step);
    }
    goals.appendChild(goal);
  }
  p.appendChild(goals);
  return p;
}

function mkMoodCalendar(y,m,c){
  const colors=c||getColors();
  const p=pg('mood-cal',colors);
  p.classList.add('fcol');
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — Mood`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const wdayLabels=getWdayLabels();
  const startOffset=opts.weekstart==='sunday'?0:1;
  const firstDay=firstDow(y,m);
  const offset=(firstDay-startOffset+7)%7;
  const totalDays=daysInMonth(y,m);
  const flat=Array(offset).fill(0);
  for(let d=1;d<=totalDays;d++) flat.push(d);
  while(flat.length%7) flat.push(0);

  const grid=el('div','');
  const rows=flat.length/7;
  grid.style.cssText=`display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:auto repeat(${rows},1fr);gap:0;width:100%;flex:1;`;

  wdayLabels.forEach(lbl=>{
    const h=el('div','');
    h.style.cssText=`font-size:5pt;font-weight:700;text-transform:uppercase;text-align:center;color:${colors.dim};padding:1mm 0;`;
    h.textContent=lbl;
    grid.appendChild(h);
  });

  flat.forEach(d=>{
    const cell=el('div','');
    if(d===0){
      cell.style.cssText='padding:1mm;';
      grid.appendChild(cell);
      return;
    }
    const dayOfWeek=dow(y,m,d);
    const isWe=(dayOfWeek===0||dayOfWeek===6);
    cell.style.cssText=`padding:1mm;text-align:center;border:.2pt solid ${colors.line};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5mm;`;
    const dn=el('div','',d);
    dn.style.cssText=`font-size:4.5pt;color:${isWe?colors.dot:colors.dim};line-height:1;`;
    cell.appendChild(dn);
    const circle=el('div','');
    const sz=tnSize();
    const circR=Math.min(4, (sz.w-2*(opts.margin+1))/7/3);
    circle.style.cssText=`width:${circR}mm;height:${circR}mm;border-radius:50%;border:.4pt solid ${colors.line};`;
    cell.appendChild(circle);
    grid.appendChild(cell);
  });
  p.appendChild(grid);

  const legend=el('div','');
  legend.style.cssText=`display:flex;justify-content:center;gap:3mm;padding:2mm 0 0;flex-shrink:0;`;
  MOOD_ICONS5.forEach(name=>{
    const item=el('div','');
    item.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:.5mm;`;
    const circ=el('div','');
    circ.style.cssText=`width:3mm;height:3mm;border-radius:50%;border:.3pt solid ${colors.line};`;
    item.appendChild(circ);
    const ico=lucideEl(name,'3.5mm','3.5mm');
    ico.style.color=colors.dim;
    item.appendChild(ico);
    legend.appendChild(item);
  });
  p.appendChild(legend);
  return p;
}

function mkExpenseTracker(y,m,c){
  const colors=c||getColors();
  const p=pg('expenses',colors);
  p.classList.add('fcol');
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — Expenses`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const sz=tnSize();
  const usableW=sz.w-2*(opts.margin+1);
  const catW=+(usableW*0.4).toFixed(1);
  const numW=+(usableW*0.2).toFixed(1);

  const tbl=el('div','');
  tbl.style.cssText=`display:grid;grid-template-columns:${catW}mm ${numW}mm ${numW}mm ${numW}mm;gap:0;width:100%;`;

  ['Category','Budget','Actual','+/−'].forEach((lbl,i)=>{
    const h=el('div','',lbl);
    h.style.cssText=`font-size:5pt;font-weight:700;text-transform:uppercase;color:${colors.dim};padding:1mm .5mm;border-bottom:.4pt solid ${colors.dim};${i>0?'text-align:right;':''}`;
    tbl.appendChild(h);
  });

  const cats=['Housing','Food','Transport','Health','Entertainment','Shopping','Subscriptions','Savings',''];
  const totalRows=16;
  for(let r=0;r<totalRows;r++){
    const isLast=r===totalRows-1;
    const catLabel=r<cats.length?cats[r]:'';
    const borderStyle=isLast?`.5pt solid ${colors.dim}`:`.2pt solid ${colors.line}`;
    const cat=el('div','',isLast?'TOTAL':catLabel);
    cat.style.cssText=`font-size:${isLast?'5pt':'4.5pt'};color:${isLast?colors.ink:colors.dot};padding:1.2mm .5mm;border-bottom:${borderStyle};${isLast?'font-weight:700;text-transform:uppercase;':''}`;
    tbl.appendChild(cat);
    for(let col=0;col<3;col++){
      const nc=el('div','');
      nc.style.cssText=`padding:1.2mm .5mm;border-bottom:${borderStyle};border-left:.2pt solid ${colors.line};`;
      tbl.appendChild(nc);
    }
  }
  p.appendChild(tbl);

  const fill=el('div','d-fill');
  fill.style.cssText=getFillStyle(colors);
  p.appendChild(fill);
  return p;
}

function mkReflection(y,m,c){
  const colors=c||getColors();
  const p=pg('reflection',colors);
  p.classList.add('fcol');
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — Reflection`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const sections=[
    {title:'Wins & Achievements',icon:'trophy',lines:4},
    {title:'Areas to Improve',icon:'target',lines:4},
    {title:'Focus for Next Month',icon:'compass',lines:3}
  ];
  const wrap=el('div','');
  wrap.style.cssText='display:flex;flex-direction:column;gap:2mm;flex:1;';
  sections.forEach((sec,si)=>{
    const block=el('div','');
    block.style.cssText=`flex:1;display:flex;flex-direction:column;${si<sections.length-1?'border-bottom:.3pt solid '+colors.line+';padding-bottom:2mm;':''}`;
    const titleRow=el('div','');
    titleRow.style.cssText=`display:flex;align-items:center;gap:1.5mm;margin-bottom:1.5mm;`;
    const ico=lucideEl(sec.icon,'3mm','3mm');
    ico.style.color=colors.dim;
    titleRow.appendChild(ico);
    const t=el('span','',sec.title);
    t.style.cssText=`font-size:6pt;font-weight:700;color:${colors.dim};text-transform:uppercase;letter-spacing:.06em;`;
    titleRow.appendChild(t);
    block.appendChild(titleRow);
    for(let l=0;l<sec.lines;l++){
      const line=el('div','');
      line.style.cssText=`border-bottom:.2pt ${l===sec.lines-1?'dotted':'solid'} ${colors.line};height:4mm;`;
      block.appendChild(line);
    }
    wrap.appendChild(block);
  });
  p.appendChild(wrap);
  return p;
}

function mkPrintGuide(pageCount,sheetCount){
  const sz=tnSize();
  const d=document.createElement('div');
  d.className='guide-sheet';
  d.innerHTML=`
    <div class="guide-title">Booklet Assembly Guide</div>
    <div class="guide-sub">${sz.label} (${sz.w}×${sz.h}mm) · ${pageCount} pages · ${sheetCount} sheets · A4 landscape duplex</div>
    <div class="guide-steps">
      <div class="guide-step">
        <div class="guide-step-num">1</div>
        <div class="guide-step-title">Print</div>
        <div class="guide-step-body">
          <ul>
            <li>Paper: <strong>A4</strong></li>
            <li>Orientation: <strong>Landscape</strong></li>
            <li>Duplex: <strong>${opts.flip==='short'?'Short':'Long'}-edge flip</strong></li>
            <li>Scale: <strong>100%</strong> (no fit-to-page)</li>
            <li>Margins: <strong>None / Minimum</strong></li>
          </ul>
          Print all ${sheetCount} sheets double-sided.
          <div class="guide-diagram">
            <svg viewBox="0 0 120 50" width="120" height="50">
              <rect x="2" y="2" width="80" height="46" rx="1" fill="none" stroke="#aaa" stroke-width=".6"/>
              <rect x="6" y="6" width="33" height="38" rx=".5" fill="#f0ede2" stroke="#ccc" stroke-width=".4"/>
              <rect x="43" y="6" width="33" height="38" rx=".5" fill="#f0ede2" stroke="#ccc" stroke-width=".4"/>
              <line x1="40" y1="4" x2="40" y2="46" stroke="#bbb" stroke-width=".4" stroke-dasharray="2,1.5"/>
              <text x="90" y="18" font-size="5" fill="#888">A4</text>
              <text x="90" y="26" font-size="5" fill="#888">landscape</text>
              <text x="90" y="34" font-size="5" fill="#888">duplex</text>
            </svg>
          </div>
        </div>
      </div>
      <div class="guide-step">
        <div class="guide-step-num">2</div>
        <div class="guide-step-title">Stack &amp; Staple</div>
        <div class="guide-step-body">
          <ul>
            <li>Stack all printed sheets in order (sheet 1 on top)</li>
            <li>Align edges carefully</li>
            <li>Place <strong>2–3 staples</strong> along the center fold line</li>
            <li>Use a long-reach stapler or staple into cardboard and bend manually</li>
          </ul>
          <div class="guide-diagram">
            <svg viewBox="0 0 120 55" width="120" height="55">
              <rect x="5" y="10" width="110" height="35" rx=".5" fill="#faf8f4" stroke="#ccc" stroke-width=".4"/>
              <rect x="4" y="11" width="110" height="35" rx=".5" fill="none" stroke="#ddd" stroke-width=".3"/>
              <rect x="3" y="12" width="110" height="35" rx=".5" fill="none" stroke="#eee" stroke-width=".3"/>
              <line x1="60" y1="8" x2="60" y2="49" stroke="#e06050" stroke-width=".5" stroke-dasharray="2,1"/>
              <rect x="58" y="14" width="4" height="3" rx=".5" fill="#888"/>
              <rect x="58" y="25" width="4" height="3" rx=".5" fill="#888"/>
              <rect x="58" y="36" width="4" height="3" rx=".5" fill="#888"/>
              <text x="70" y="22" font-size="4.5" fill="#888">staple flat</text>
              <text x="70" y="29" font-size="4.5" fill="#888">on center line</text>
            </svg>
          </div>
        </div>
      </div>
      <div class="guide-step">
        <div class="guide-step-num">3</div>
        <div class="guide-step-title">Fold</div>
        <div class="guide-step-body">
          <ul>
            <li>Fold the stapled stack in half along the <strong>staple line</strong></li>
            <li>Crease firmly with a bone folder or ruler edge</li>
            <li>Press flat under heavy books for best result</li>
          </ul>
          <div class="guide-diagram">
            <svg viewBox="0 0 120 55" width="120" height="55">
              <rect x="5" y="8" width="50" height="40" rx=".5" fill="#f0ede2" stroke="#ccc" stroke-width=".4"/>
              <rect x="6" y="9" width="50" height="40" rx=".5" fill="#f5f2eb" stroke="#ccc" stroke-width=".4"/>
              <rect x="7" y="10" width="50" height="40" rx=".5" fill="#faf8f4" stroke="#ccc" stroke-width=".4"/>
              <line x1="32" y1="8" x2="32" y2="52" stroke="#e06050" stroke-width=".5" stroke-dasharray="2,1"/>
              <rect x="30.5" y="16" width="3" height="2.5" rx=".5" fill="#888"/>
              <rect x="30.5" y="28" width="3" height="2.5" rx=".5" fill="#888"/>
              <rect x="30.5" y="40" width="3" height="2.5" rx=".5" fill="#888"/>
              <path d="M36,6 C50,6 56,25 56,30" fill="none" stroke="#555" stroke-width=".5" marker-end="url(#arw)"/>
              <defs><marker id="arw" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="none" stroke="#555" stroke-width=".6"/></marker></defs>
              <text x="65" y="20" font-size="4.5" fill="#888">fold along</text>
              <text x="65" y="27" font-size="4.5" fill="#888">staple line</text>
            </svg>
          </div>
        </div>
      </div>
      <div class="guide-step">
        <div class="guide-step-num">4</div>
        <div class="guide-step-title">Trim to Size</div>
        <div class="guide-step-body">
          <ul>
            <li>Use crop marks as cutting guides</li>
            <li>Cut the <strong>top, bottom, and open edge</strong> (not the spine)</li>
            <li>Use a metal ruler + craft knife or guillotine cutter</li>
            <li>Final size: <strong>${sz.w}×${sz.h}mm</strong></li>
          </ul>
          <div class="guide-diagram">
            <svg viewBox="0 0 120 60" width="120" height="60">
              <rect x="15" y="5" width="45" height="50" rx=".5" fill="#faf8f4" stroke="#ccc" stroke-width=".4"/>
              <line x1="20" y1="10" x2="20" y2="50" stroke="#aaa" stroke-width=".3"/>
              <rect x="22" y="12" width="35" height="36" rx=".3" fill="none" stroke="#e06050" stroke-width=".5" stroke-dasharray="1.5,.8"/>
              <line x1="22" y1="3" x2="22" y2="8" stroke="#333" stroke-width=".4"/>
              <line x1="57" y1="3" x2="57" y2="8" stroke="#333" stroke-width=".4"/>
              <line x1="22" y1="53" x2="22" y2="58" stroke="#333" stroke-width=".4"/>
              <line x1="57" y1="53" x2="57" y2="58" stroke="#333" stroke-width=".4"/>
              <text x="68" y="22" font-size="4.5" fill="#888">cut along</text>
              <text x="68" y="29" font-size="4.5" fill="#888">crop marks</text>
              <text x="68" y="40" font-size="5" font-weight="700" fill="#555">${sz.w}×${sz.h}mm</text>
            </svg>
          </div>
        </div>
      </div>
    </div>`;
  return d;
}

function mkCalendarGrid(page,colors,wdayLabels,weeks){
  const y=parseInt($('sel-y').value),m=parseInt($('sel-m').value);
  const hmap=holidayMap(y,m);
  const grid=el('div','cal-grid');
  grid.style.gridTemplateRows=`auto repeat(${weeks.length},1fr)`;
  wdayLabels.forEach(lbl=>{
    const cell=el('div','cal-hdr-cell',lbl);
    cell.style.color=colors.dim;
    grid.appendChild(cell);
  });
  weeks.forEach(wk=>{
    wk.forEach(d=>{
      if(d===0){ grid.appendChild(el('div','cal-cell empty')); return; }
      const dayOfWeek=dow(y,m,d);
      const isWeekend=(dayOfWeek===0||dayOfWeek===6);
      let cls='cal-cell';
      if(isWeekend) cls+=' weekend';
      const cell=el('div',cls);
      cell.style.borderColor=colors.line;
      cell.style.color=isWeekend?colors.dot:colors.ink;
      const num=el('div','cal-cell-num',d);
      cell.appendChild(num);
      if(hmap[d]){
        const hol=el('div','cal-hol',hmap[d].join(', '));
        hol.style.color=colors.dim;
        cell.appendChild(hol);
      }
      grid.appendChild(cell);
    });
  });
  page.appendChild(grid);
}

function mkCalendar(y,m,c){
  const colors=c||getColors();
  const wdayLabels=getWdayLabels();
  const startOffset=opts.weekstart==='sunday'?0:1;
  const firstDay=firstDow(y,m);
  const offset=(firstDay-startOffset+7)%7;
  const totalDays=daysInMonth(y,m);

  const flat=Array(offset).fill(0);
  for(let d=1;d<=totalDays;d++) flat.push(d);
  while(flat.length%7) flat.push(0);
  const allWeeks=[];
  for(let i=0;i<flat.length;i+=7) allWeeks.push(flat.slice(i,i+7));

  if(opts.calSpread){
    return mkCalendarColumnSpread(y,m,colors,allWeeks);
  } else {
    const p=pg('calendar',colors); p.classList.add('fcol');
    const hdr=el('div','sh',`${MONTHS[m]} ${y}`);
    hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};background:${colors.page};`;
    p.appendChild(hdr);
    mkCalendarGrid(p,colors,wdayLabels,allWeeks);
    return [p];
  }
}

function mkCalendarColumnSpread(y,m,colors,weeks){
  const weekDowOrder=opts.weekstart==='sunday'?[0,1,2,3,4,5,6]:[1,2,3,4,5,6,0];
  const numWeeks=weeks.length;

  const p1=pg('calendar-spread-1',colors); p1.classList.add('fcol');
  const h1=el('div','sh',`${MONTHS[m]} ${y}`);
  h1.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p1.appendChild(h1);
  p1.appendChild(buildSpreadHalf(colors,weeks,weekDowOrder,0,4,false,numWeeks));

  const p2=pg('calendar-spread-2',colors); p2.classList.add('fcol');
  const h2=el('div','sh',`${MONTHS[m]} ${y}`);
  h2.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p2.appendChild(h2);
  p2.appendChild(buildSpreadHalf(colors,weeks,weekDowOrder,4,7,true,numWeeks));

  return [p1,p2];
}

function buildSpreadHalf(colors,weeks,weekDowOrder,startPos,endPos,hasNotes,numWeeks){
  const y=parseInt($('sel-y').value),m=parseInt($('sel-m').value);
  const hmap=holidayMap(y,m);
  const numDays=endPos-startPos;
  const colFr=Array(numDays).fill('1fr').join(' ')+(hasNotes?' 1fr':'');
  const grid=el('div','cal-sp-grid');
  grid.style.gridTemplateColumns=colFr;
  grid.style.gridTemplateRows=`auto repeat(${numWeeks},1fr)`;

  // Day name headers
  for(let pos=startPos;pos<endPos;pos++){
    const di=weekDowOrder[pos];
    const isWknd=di===0||di===6;
    const hdr=el('div','cal-sp-dhdr',DOW_ABB3[di].toUpperCase());
    hdr.style.cssText=`color:${isWknd?colors.dot:colors.dim};border-color:${colors.line};`;
    grid.appendChild(hdr);
  }
  if(hasNotes){
    const nhdr=el('div','cal-sp-dhdr','NOTES');
    nhdr.style.cssText=`color:${colors.dim};border-color:${colors.line};`;
    grid.appendChild(nhdr);
  }

  // Week rows
  weeks.forEach(week=>{
    for(let pos=startPos;pos<endPos;pos++){
      const d=week[pos];
      const di=weekDowOrder[pos];
      const isWknd=di===0||di===6;
      const isEmpty=d===0;
      let cls='cal-sp-cell'+(isWknd?' weekend':'')+(isEmpty?' empty':'');
      const cell=el('div',cls);
      cell.style.borderColor=colors.line;
      if(!isEmpty){
        const dt=el('span','cal-sp-date',String(d));
        dt.style.color=isWknd?colors.dot:colors.dim;
        cell.appendChild(dt);
        if(hmap[d]){
          const hol=el('span','cal-sp-hol',hmap[d].join(', '));
          hol.style.color=colors.dim;
          cell.appendChild(hol);
        }
      }
      grid.appendChild(cell);
    }
    if(hasNotes){
      const nc=el('div','cal-sp-notes');
      nc.style.borderColor=colors.line;
      for(let ci=0;ci<12;ci++){
        const nr=el('div','cal-sp-nr');
        const circ=el('div','cal-sp-circ');
        circ.style.borderColor=colors.line;
        const nl=el('div','cal-sp-nl');
        nl.style.borderBottomColor=colors.line;
        nr.appendChild(circ);nr.appendChild(nl);
        nc.appendChild(nr);
      }
      grid.appendChild(nc);
    }
  });
  return grid;
}

function mkMonthNotes(y,m,c){
  const colors=c||getColors();
  const p=pg('monthly-notes',colors);
  p.style.cssText+=getFillStyle(colors);
  const h=el('div','sh',`${MONTHS[m]} ${y} — Notes`);
  h.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};background:${colors.page};`;
  p.appendChild(h);
  return p;
}

function mkMonthGraphs(y,m,c){
  const colors=c||getColors();
  const p=pg('monthly-graphs',colors);
  p.classList.add('fcol');
  const metrics=graphMetrics.length>0?graphMetrics:[{id:0,title:'Weight'},{id:0,title:'Steps'}];
  const titleList=metrics.map(mt=>mt.title).join(' & ');
  const hdr=el('div','sh',`${MONTHS[m]} ${y} — ${titleList}`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const days=daysInMonth(y,m);
  const sz=tnSize();
  const pageMM=sz.w - 2*(opts.margin+1);
  const gapMM=2*(metrics.length-1);
  const graphW=+(( pageMM - gapMM ) / metrics.length).toFixed(2);
  const wrap=el('div','gph-wrap');
  metrics.forEach(metric=>{
    const item=el('div','gph-item');
    item.insertAdjacentHTML('beforeend',buildGraphSVG(days,metric,colors,y,m,graphW));
    wrap.appendChild(item);
  });
  p.appendChild(wrap);
  return p;
}

function mkWeekSummary(y,m,wn,wdays,c){
  const colors=c||getColors();
  const cbSize=opts.cbsize;
  const labels=getWdayLabels();
  const p=pg(`wk${wn}`,colors);
  p.classList.add('fcol');
  const valid=wdays.filter(d=>d>0);
  const hdr=el('div','sh',`Week ${wn} · ${MONTHS[m]} ${valid[0]}–${valid[valid.length-1]}`);
  hdr.style.cssText=`color:${getElemColor('sectionHdr',colors.dim)};border-bottom:.3pt solid ${colors.line};`;
  p.appendChild(hdr);

  const sec=el('div','wk-hab-sec');
  sec.style.gridTemplateColumns=`1fr repeat(7,${cbSize}mm)`;

  sec.appendChild(el('div',''));
  wdays.forEach((d,i)=>{
    const cell=el('div',`wk-dhc${d===0?' pad':''}`);
    cell.innerHTML=`<span class="dl" style="color:${colors.ink}">${labels[i]}</span><span class="dn" style="color:${colors.dim}">${d>0?d:''}</span>`;
    sec.appendChild(cell);
  });

  const habitsToShow=habits.length>0?habits:[{icon:'star',name:'Add habits',days:[0,1,2,3,4,5,6]}];
  habitsToShow.forEach(h=>{
    const nameCell=el('span','wk-hab-name');
    if(h.id) nameCell.dataset.habitId=h.id;
    const ico=lucideEl(h.icon,(opts.iconSize??5)+'mm',(opts.iconSize??5)+'mm');
    ico.style.color=getHabitIconColor(h,colors);
    nameCell.appendChild(ico);
    const textSpan=el('span','',h.name);
    textSpan.style.color=getHabitNameColor(h,colors);
    const hf=getHabitFont(h);
    if(hf) textSpan.style.fontFamily=`'${hf}',serif`;
    nameCell.appendChild(textSpan);
    sec.appendChild(nameCell);
    wdays.forEach((d,i)=>{
      const cell=el('div','wk-hab-cell');
      cell.style.cssText=`width:${cbSize}mm;height:${cbSize}mm;border:.4pt solid ${colors.line};${getCheckboxStyle(cbSize)}`;
      if(d===0){ cell.classList.add('pad'); cell.style.opacity='.15'; cell.style.background=colors.bg; }
      else if(h.days&&!h.days.includes(i)){ cell.classList.add('na'); cell.style.cssText+=`border:.4pt dashed ${colors.line};background:none;`; }
      sec.appendChild(cell);
    });
  });

  p.appendChild(sec);
  const sep=el('hr','d-sep');
  sep.style.cssText=getSeparatorStyle(colors);
  p.appendChild(sep);
  const fill=el('div','d-fill');
  fill.style.cssText=getFillStyle(colors);
  p.appendChild(fill);
  return p;
}

function getMoonPhase(year,month,day){
  const known=new Date(2000,0,6);
  const target=new Date(year,month,day);
  const synodic=29.530588853;
  const diff=(target-known)/86400000;
  return((diff%synodic)+synodic)%synodic/synodic;
}

function mkBatterySVG(segs, color, strokeW, stretch=false){
  const sw=strokeW??0.4, segH=2.5, w=5, termW=3.5, termH=1.5;
  const bodyH=segs*segH;
  const totalH=bodyH+termH;
  const hAttr=stretch?'100%':`${totalH}mm`;
  const pAR=stretch?'none':'xMidYMid meet';
  let dividers='';
  for(let i=1;i<segs;i++){
    const y=(termH+i*segH).toFixed(2);
    dividers+=`<line x1="${sw}" y1="${y}" x2="${w-sw}" y2="${y}" stroke="${color}" stroke-width="${(sw*0.5).toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${totalH}" width="${w}mm" height="${hAttr}" preserveAspectRatio="${pAR}" style="flex-shrink:0;display:block;${stretch?'height:100%;':''}">
    <rect x="${((w-termW)/2).toFixed(2)}" y="${(sw/2).toFixed(2)}" width="${termW}" height="${(termH-sw/2).toFixed(2)}" fill="${color}" rx="0.2"/>
    <rect x="${(sw/2).toFixed(2)}" y="${termH}" width="${(w-sw).toFixed(2)}" height="${(bodyH-sw).toFixed(2)}" fill="none" stroke="${color}" stroke-width="${sw}" rx="0.3"/>
    ${dividers}
  </svg>`;
}

function moonPhaseSVG(phase,sz,ink){
  const r=10,d=r*2;
  const circle=`<circle cx="${r}" cy="${r}" r="${r-1}" fill="none" stroke="${ink}" stroke-width="1"/>`;
  if(phase<=0.03||phase>=0.97)
    return `<svg viewBox="0 0 ${d} ${d}" width="${sz}" height="${sz}" style="flex-shrink:0;display:block;">${circle}</svg>`;
  if(phase>=0.47&&phase<=0.53)
    return `<svg viewBox="0 0 ${d} ${d}" width="${sz}" height="${sz}" style="flex-shrink:0;display:block;"><circle cx="${r}" cy="${r}" r="${r-0.5}" fill="${ink}"/></svg>`;
  const waxing=phase<0.5;
  let rxTerm,limbSweep,termSweep;
  if(waxing){
    rxTerm=r*Math.cos(2*Math.PI*phase);
    limbSweep=1;termSweep=rxTerm<0?1:0;
  }else{
    rxTerm=r*Math.cos(2*Math.PI*(1-phase));
    limbSweep=0;termSweep=rxTerm<0?0:1;
  }
  const rx=Math.abs(rxTerm).toFixed(2);
  const path=`M ${r},0 A ${r},${r} 0 0,${limbSweep} ${r},${d} A ${rx},${r} 0 0,${termSweep} ${r},0 Z`;
  return `<svg viewBox="0 0 ${d} ${d}" width="${sz}" height="${sz}" style="flex-shrink:0;display:block;">${circle}<path d="${path}" fill="${ink}"/></svg>`;
}

function mkDay(y,m,d,c){
  const colors=c||getColors();
  const p=pg(`${m+1}/${d}`,colors);
  p.classList.add('fcol');
  const w=dow(y,m,d);
  const wdayIdx=opts.weekstart==='sunday' ? w : (w+6)%7;

  const hdr=el('div','d-hdr');
  hdr.style.cssText=`border-bottom:.3pt solid ${colors.line};`;
  const dowWrap=el('div','d-dow-wrap');
  const dowEl=el('span','d-dow',DOW_FULL[w]);
  dowEl.style.color=getElemColor('dayName',colors.dim);
  dowWrap.appendChild(dowEl);
  const dayHols=holidayMap(y,m)[d];
  if(dayHols&&dayHols.length){
    const holEl=el('span','d-hol',dayHols.join(' · '));
    holEl.style.color=colors.dim;
    dowWrap.appendChild(holEl);
  }
  hdr.appendChild(dowWrap);
  if(opts.moonPhase){
    const phase=getMoonPhase(y,m,d);
    const moonWrap=el('span','d-moon');
    moonWrap.style.cssText=`position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:inline-flex;align-items:center;justify-content:center;opacity:.55;`;
    moonWrap.innerHTML=moonPhaseSVG(phase,(opts.moonSize??3.5)+'mm',getElemColor('moonColor',colors.dim));
    hdr.appendChild(moonWrap);
  }
  const numEl=el('span','d-num',d);
  numEl.style.color=getElemColor('dayNum',colors.line);
  hdr.appendChild(numEl);
  p.appendChild(hdr);

  function mkDailyField(f){
    const field=el('div','d-field');
    const lbl=el('span','d-field-lbl',f.label);
    lbl.style.color=getElemColor('fieldLabel',colors.dim);
    lbl.dataset.fieldId=f.id;
    field.appendChild(lbl);
    const line=el('div','d-field-line');
    line.style.borderBottom=`.3pt solid ${colors.dim}`;
    field.appendChild(line);
    return field;
  }

  const msw=el('div','d-msw');
  const WEATHER_ICON_LIST=['sun','cloud','cloud-rain','cloud-snow','cloud-lightning'];

  const mkBatteryEl=(stretch=false)=>{
    const wrap=el('div','d-battery');
    if(stretch) wrap.style.cssText='display:flex;align-items:stretch;align-self:stretch;';
    wrap.innerHTML=mkBatterySVG(opts.batterySegs??5, getElemColor('batteryColor',colors.dim), opts.batteryStroke??0.4, stretch);
    return wrap;
  };

  if(opts.weatherIcons){
    const wColor=getElemColor('weatherIcons',colors.dim);
    const mkWIcons=()=>{
      const wIcons=el('div','d-weather-icons');
      wIcons.style.color=wColor;
      WEATHER_ICON_LIST.forEach(name=>wIcons.appendChild(lucideEl(name,(opts.weatherIconSize??5)+'mm',(opts.weatherIconSize??5)+'mm')));
      return wIcons;
    };

    if(opts.mood){
      if(opts.energyBattery){
        // Grid: col1=icons auto, col2=battery auto (spans 2 rows), col3=fields 1fr
        msw.style.cssText='display:grid;grid-template-columns:auto auto 1fr;gap:1.5mm 2mm;align-items:center;';
        const faces=el('div','d-faces');
        faces.style.cssText='grid-area:1/1/2/2;color:'+getElemColor('moodIcons',colors.dim)+';';
        const moodIcons=opts.moodfaces===3?MOOD_ICONS3:MOOD_ICONS5;
        moodIcons.forEach(name=>faces.appendChild(lucideEl(name,(opts.fzMoodSz??3.5)+'mm',(opts.fzMoodSz??5)+'mm')));
        const batt=mkBatteryEl(true);
        batt.style.gridArea='1/2/3/3';
        const wRow=el('div','d-weather');
        wRow.style.gridArea='2/1/3/2';
        wRow.appendChild(mkWIcons());
        const half=Math.ceil(dailyFields.length/2);
        const f1=el('div');
        f1.style.cssText='display:flex;align-items:center;gap:2mm;grid-area:1/3/2/4;';
        dailyFields.slice(0,half).forEach(f=>f1.appendChild(mkDailyField(f)));
        const f2=el('div');
        f2.style.cssText='display:flex;align-items:center;gap:2mm;grid-area:2/3/3/4;';
        dailyFields.slice(half).forEach(f=>f2.appendChild(mkDailyField(f)));
        msw.appendChild(faces);
        msw.appendChild(batt);
        msw.appendChild(wRow);
        msw.appendChild(f1);
        msw.appendChild(f2);
      } else {
        msw.style.flexDirection='column';
        msw.style.gap='1.5mm';
        const row1=el('div');
        row1.style.cssText='display:flex;align-items:center;gap:2mm;width:100%;';
        const row2=el('div','d-weather');
        row2.style.cssText='display:flex;align-items:center;gap:2mm;width:100%;';
        const faces=el('div','d-faces');
        faces.style.color=getElemColor('moodIcons',colors.dim);
        const moodIcons=opts.moodfaces===3?MOOD_ICONS3:MOOD_ICONS5;
        moodIcons.forEach(name=>faces.appendChild(lucideEl(name,(opts.fzMoodSz??5)+'mm',(opts.fzMoodSz??5)+'mm')));
        row1.appendChild(faces);
        row2.appendChild(mkWIcons());
        const half=Math.ceil(dailyFields.length/2);
        dailyFields.slice(0,half).forEach(f=>row1.appendChild(mkDailyField(f)));
        dailyFields.slice(half).forEach(f=>row2.appendChild(mkDailyField(f)));
        msw.appendChild(row1);
        msw.appendChild(row2);
      }
    } else {
      const row=el('div','d-weather');
      row.style.cssText='display:flex;align-items:center;gap:2mm;width:100%;';
      const wIcons=mkWIcons();
      if(opts.energyBattery) wIcons.appendChild(mkBatteryEl());
      row.appendChild(wIcons);
      dailyFields.forEach(f=>row.appendChild(mkDailyField(f)));
      msw.appendChild(row);
    }
  } else {
    if(opts.mood){
      const faces=el('div','d-faces');
      faces.style.color=getElemColor('moodIcons',colors.dim);
      const moodIcons=opts.moodfaces===3?MOOD_ICONS3:MOOD_ICONS5;
      moodIcons.forEach(name=>faces.appendChild(lucideEl(name,(opts.fzMoodSz??5)+'mm',(opts.fzMoodSz??5)+'mm')));
      if(opts.energyBattery) faces.appendChild(mkBatteryEl());
      msw.appendChild(faces);
    } else if(opts.energyBattery){
      const battWrap=el('div','d-faces');
      battWrap.appendChild(mkBatteryEl());
      msw.appendChild(battWrap);
    }
    dailyFields.forEach(f=>msw.appendChild(mkDailyField(f)));
  }

  if(opts.mood||dailyFields.length>0||opts.weatherIcons||opts.energyBattery){
    p.appendChild(msw);
    const sep1=el('hr','d-sep');
    sep1.style.cssText=getSeparatorStyle(colors);
    p.appendChild(sep1);
  }

  const habList=el('div','d-hab-list');
  const todayHabits=habits.filter(h=>!h.days||h.days.includes(wdayIdx));
  todayHabits.forEach(h=>{
    const row=el('div','d-hab-row');
    row.dataset.habitId=h.id;
    const box=el('div','d-box');
    box.style.cssText=`border:.5pt solid ${colors.dim};${getCheckboxStyle()}`;
    row.appendChild(box);
    const ico=el('span','d-hab-icon');
    ico.style.color=getHabitIconColor(h,colors);
    ico.appendChild(lucideEl(h.icon,(opts.iconSize??3.5)+'mm',(opts.iconSize??3.5)+'mm'));
    row.appendChild(ico);
    const name=el('span','d-hab-name',h.name);
    name.style.color=getHabitNameColor(h,colors);
    const hf=getHabitFont(h);
    if(hf) name.style.fontFamily=`'${hf}',serif`;
    row.appendChild(name);
    habList.appendChild(row);
  });
  for(let i=0;i<opts.emptyLines;i++){
    const row=el('div','d-hab-row');
    const box=el('div','d-box');
    box.style.cssText=`border:.5pt solid ${colors.dim};${getCheckboxStyle()}`;
    row.appendChild(box);
    const tline=el('div','d-tline');
    tline.style.borderBottom=`.3pt solid ${colors.line}`;
    row.appendChild(tline);
    habList.appendChild(row);
  }
  p.appendChild(habList);
  const sep2=el('hr','d-sep');
  sep2.style.cssText=getSeparatorStyle(colors);
  p.appendChild(sep2);
  const fill=el('div','d-fill');
  fill.style.cssText=getFillStyle(colors);
  p.appendChild(fill);
  return p;
}

/* ══════════════════════════════════════════════
   VIEW MODES
   ══════════════════════════════════════════════ */
let currentView='pages';
function setView(mode){
  currentView=mode;
  $('print-area').style.display=mode==='print'?'':'none';
  $('page-preview').style.display=mode==='pages'?'flex':'none';
  $('book-view').style.display=mode==='book'?'flex':'none';
  $('view-btn').classList.toggle('btn-p',mode==='pages');
  $('view-btn').classList.toggle('btn-s',mode!=='pages');
  $('book-btn').classList.toggle('btn-p',mode==='book');
  $('book-btn').classList.toggle('btn-s',mode!=='book');
  $('print-btn').classList.toggle('btn-p',mode==='print');
  $('print-btn').classList.toggle('btn-s',mode!=='print');
}

/* ══════════════════════════════════════════════
   GENERATE + IMPOSE
   ══════════════════════════════════════════════ */
function getSavePaperLayout(sz,paper){
  const sw=sz.w*2,sh=sz.h;
  const cL=Math.floor(paper.w/sw),rL=Math.floor(paper.h/sh);
  const cP=Math.floor(paper.h/sw),rP=Math.floor(paper.w/sh);
  const nL=cL*rL,nP=cP*rP;
  if(nL<=1&&nP<=1) return null;
  if(nL>=nP) return {cols:cL,rows:rL,portrait:false,spreadsPerSide:nL};
  return {cols:cP,rows:rP,portrait:true,spreadsPerSide:nP};
}

function generate(){
  saveState();
  const m=parseInt($('sel-m').value);
  const y=parseInt($('sel-y').value);
  const colors=getColors();

  const root=document.documentElement;
  COLOR_VARS.forEach(k=>root.style.setProperty('--'+k,colors[k]));
  const sz=tnSize();
  const paper=getPaperSize();
  const layout2up=opts.savePaper?getSavePaperLayout(sz,paper):null;
  const sheetW=layout2up?.portrait?paper.h:paper.w;
  const sheetH=layout2up?.portrait?paper.w:paper.h;
  root.style.setProperty('--tn-w',sz.w+'mm');
  root.style.setProperty('--tn-h',sz.h+'mm');
  root.style.setProperty('--tn-aspect',sz.w+'/'+sz.h);
  root.style.setProperty('--spread-w',(sz.w*2)+'mm');
  root.style.setProperty('--sheet-w',sheetW+'mm');
  root.style.setProperty('--sheet-h',sheetH+'mm');
  root.style.setProperty('--sheet-aspect',sheetW+'/'+sheetH);
  const spreadTop=+((sheetH - sz.h)/2).toFixed(2);
  const spreadLeft=+((sheetW - sz.w*2)/2).toFixed(2);
  root.style.setProperty('--spread-top', spreadTop+'mm');
  root.style.setProperty('--spread-left', spreadLeft+'mm');
  root.style.setProperty('--fold-x',(sheetW/2)+'mm');
  root.style.setProperty('--icon-sz',    (opts.iconSize??5)+'mm');
  root.style.setProperty('--icon-gap',   (opts.iconGap??1.5)+'mm');
  root.style.setProperty('--icon-stroke',(opts.iconStroke??1.5));
  root.style.setProperty('--fz-weekhdr', (opts.fzWeekHdr??6)+'pt');
  root.style.setProperty('--fz-dow',     (opts.fzDow??6)+'pt');
  root.style.setProperty('--fz-daynum',  (opts.fzDayNum??18)+'pt');
  root.style.setProperty('--cal-sp-date-sz',(opts.calNumSz??6.5)+'pt');
  root.style.setProperty('--cal-sp-hol-sz', (opts.calHolSz??4.5)+'pt');
  root.style.setProperty('--fz-habit',   (opts.fzHabit??6)+'pt');
  root.style.setProperty('--fz-fieldlbl',(opts.fzFieldLbl??4.5)+'pt');
  root.style.setProperty('--mood-sz',    (opts.fzMoodSz??5)+'mm');
  root.style.setProperty('--hab-row-gap',(opts.habRowGap??1.5)+'mm');
  root.style.setProperty('--mood-gap',   (opts.moodGap??2)+'mm');
  root.style.setProperty('--weather-icon-sz',(opts.weatherIconSize??3.5)+'mm');
  root.style.setProperty('--weather-gap',(opts.moodGap??2)+'mm');
  const ef=key=>`'${getElemFont(key)||activeFont()}',serif`;
  root.style.setProperty('--ef-daynum',  ef('dayNum'));
  root.style.setProperty('--ef-dayname', ef('dayName'));
  root.style.setProperty('--ef-sechdr',  ef('sectionHdr'));
  root.style.setProperty('--ef-habname', ef('habitName'));
  root.style.setProperty('--ef-fieldlbl',ef('fieldLabel'));
  root.style.setProperty('--ef-cover',   ef('coverTitle'));
  let ps=document.getElementById('dynamic-page-style');
  if(!ps){ps=document.createElement('style');ps.id='dynamic-page-style';document.head.appendChild(ps);}
  const pageSize=layout2up?.portrait?paper.page.replace(' landscape',''):paper.page;
  ps.textContent='@page{size:'+pageSize+';margin:0;}';
  const orientStr=layout2up?.portrait?'portrait':'landscape';
  const upLabel=layout2up?` · ${layout2up.spreadsPerSide}-up`:'';
  $('paper-tip').textContent=paper.label+' '+orientStr+upLabel+' · duplex · fold · staple spine · trim edges';
  document.body.style.fontFamily=`'${activeFont()}',serif`;

  const els=[];

  if(opts.cover){
    els.push(mkCover(y,m,colors));
  }

  if(opts.goalsPage) els.push(mkGoalsPage(y,m,colors));
  if(opts.calendar) els.push(...mkCalendar(y,m,colors));
  if(opts.habitMap) els.push(mkHabitMap(y,m,colors));
  if(opts.moodCal) els.push(mkMoodCalendar(y,m,colors));
  const noteCount=opts.notes;
  if(noteCount>0 && (opts.notespos==='front'||opts.notespos==='both')){
    const frontNotes=opts.notespos==='both'?Math.ceil(noteCount/2):noteCount;
    for(let i=0;i<frontNotes;i++) els.push(mkMonthNotes(y,m,colors));
  }
  if(opts.linkFieldsGraphs){ graphMetrics=dailyFields.map(f=>({id:f.id,title:f.label})); }
  if(graphMetrics.length>0) els.push(mkMonthGraphs(y,m,colors));
  buildWeeks(y,m).forEach((wdays,wi)=>{
    els.push(mkWeekSummary(y,m,wi+1,wdays,colors));
    wdays.forEach(d=>{if(d>0)els.push(mkDay(y,m,d,colors));});
  });
  if(opts.expenseTracker) els.push(mkExpenseTracker(y,m,colors));
  if(noteCount>0 && (opts.notespos==='back'||opts.notespos==='both')){
    const backNotes=opts.notespos==='both'?Math.floor(noteCount/2):noteCount;
    for(let i=0;i<backNotes;i++) els.push(mkMonthNotes(y,m,colors));
  }
  if(opts.reflectionPage) els.push(mkReflection(y,m,colors));

  if(opts.backCover){
    els.push(mkBackCover(y,m,colors));
  }

  if(opts.pagenums){
    let pgNum=1;
    els.forEach(page=>{
      const lbl=page.dataset.lbl;
      if(lbl==='cover'||lbl==='back-cover') return;
      const num=el('div','pg-num',pgNum++);
      num.style.color=colors.dot;
      page.appendChild(num);
    });
  }

  const tmp=document.createElement('div');
  tmp.style.cssText='position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
  els.forEach(e=>tmp.appendChild(e));
  document.body.appendChild(tmp);
  lucide.createIcons();

  const prev=$('page-preview');
  prev.innerHTML='';
  const allClones=[];
  Array.from(tmp.children).forEach(e=>{
    const c=e.cloneNode(true);
    c.style.boxShadow='2px 3px 10px rgba(0,0,0,.18)';
    prev.appendChild(c);
    allClones.push(e.cloneNode(true));
  });

  const bookView=$('book-view');
  bookView.innerHTML='';
  for(let i=0;i<allClones.length;i+=2){
    const spread=el('div','book-spread');
    const left=allClones[i];
    spread.appendChild(left);
    if(i+1<allClones.length){
      spread.appendChild(allClones[i+1]);
    } else {
      const blank=el('div','book-blank');
      blank.style.cssText=`width:${sz.w}mm;height:${sz.h}mm;`;
      spread.appendChild(blank);
    }
    bookView.appendChild(spread);
  }

  let pages=Array.from(tmp.children).map(e=>e.outerHTML);
  document.body.removeChild(tmp);

  let separateCovers=[];
  if(opts.coverSheet){
    const kept=[];
    pages.forEach(html=>{
      if(html.includes('data-lbl="cover"')){ separateCovers.unshift({html,lbl:'Cover (separate sheet)'}); }
      else if(html.includes('data-lbl="back-cover"')){ separateCovers.push({html,lbl:'Back Cover (separate sheet)'}); }
      else kept.push(html);
    });
    pages=kept;
  }

  const padTarget=opts.savePaper?(layout2up?layout2up.spreadsPerSide*4:2):4;
  while(pages.length%padTarget!==0){
    const dotStyle=getFillStyle(colors);
    pages.push(`<div class="pg" style="width:${sz.w}mm;height:${sz.h}mm;background-color:${colors.page};font-family:'${activeFont()}',serif;${getPagePadding()}${dotStyle}"><div class="sh" style="background:${colors.page};color:${colors.dim};border-bottom:.3pt solid ${colors.line}">Notes</div></div>`);
  }
  const n=pages.length;

  const sides=[];
  let L=0,R=n-1,sn=1;
  while(L<R){
    sides.push({l:pages[R],r:pages[L],lbl:`Sheet ${sn} Front (pp ${R+1} & ${L+1})`});
    L++;R--;
    if(L<R){
      sides.push({l:pages[L],r:pages[R],lbl:`Sheet ${sn} Back (pp ${L+1} & ${R+1})`});
      L++;R--;sn++;
    }
  }

  const flipShort=opts.flip==='short';

  const container=$('print-area');
  container.innerHTML='';

  if(layout2up){
    const {cols,rows,spreadsPerSide:M}=layout2up;
    const sw=sz.w*2,sh=sz.h;
    const contentW=sw*cols,contentH=sh*rows;
    const startX=+((sheetW-contentW)/2).toFixed(2);
    const startY=+((sheetH-contentH)/2).toFixed(2);
    const positions=[];
    for(let r=0;r<rows;r++)
      for(let c=0;c<cols;c++)
        positions.push({left:+(startX+c*sw).toFixed(2),top:+(startY+r*sh).toFixed(2)});

    const mkCropMarks2up=()=>{
      if(!opts.cropmarks) return '';
      const v=(t,l)=>`<div class="crop-mark v-mark" style="position:absolute;top:${t}mm;left:${l}mm;"></div>`;
      const h=(t,l)=>`<div class="crop-mark h-mark" style="position:absolute;top:${t}mm;left:${l}mm;"></div>`;
      let m='';
      m+=v(startY-10,startX-.2)+h(startY-.2,startX-10);
      m+=v(startY-10,startX+contentW-.2)+h(startY-.2,startX+contentW+2);
      m+=v(startY+contentH+2,startX-.2)+h(startY+contentH-.2,startX-10);
      m+=v(startY+contentH+2,startX+contentW-.2)+h(startY+contentH-.2,startX+contentW+2);
      for(let r=1;r<rows;r++){const cy=+(startY+r*sh).toFixed(2);m+=h(cy-.2,startX-10)+h(cy-.2,startX+contentW+2);}
      for(let c=1;c<cols;c++){const cx=+(startX+c*sw).toFixed(2);m+=v(startY-10,cx-.2)+v(startY+contentH+2,cx-.2);}
      for(let i=0;i<positions.length;i++){
        const fx=+(positions[i].left+sz.w).toFixed(2),fy=positions[i].top;
        m+=v(fy-10,fx-.2)+v(fy+sh+2,fx-.2);
      }
      return m;
    };
    const cropMarksHTML=mkCropMarks2up();
    const numPhysSheets=Math.ceil(sides.length/(M*2));

    for(let s=0;s<numPhysSheets;s++){
      const sBase=s*M*2;
      [true,false].forEach(isFront=>{
        const div=document.createElement('div');
        div.className='sheet'+(flipShort&&!isFront?' flip-back':'');
        div.style.cssText=`width:${sheetW}mm;height:${sheetH}mm;`;
        let html=`<div class="sheet-label">Sheet ${s+1} ${isFront?'Front':'Back'}</div>`;
        for(let j=0;j<M;j++){
          const side=sides[sBase+j*2+(isFront?0:1)];
          if(!side) continue;
          const pos=positions[j];
          if(opts.foldline) html+=`<div style="position:absolute;left:${pos.left+sz.w}mm;top:${pos.top}mm;height:${sh}mm;border-left:.3mm dashed #bbb;z-index:10;pointer-events:none;"></div>`;
          html+=`<div class="spread-container" style="position:absolute;top:${pos.top}mm;left:${pos.left}mm;">${side.l}${side.r}</div>`;
        }
        for(let r=1;r<rows;r++){const cy=+(startY+r*sh).toFixed(2);html+=`<div style="position:absolute;left:${startX}mm;top:${cy}mm;width:${contentW}mm;border-top:.25mm dashed #aaa;z-index:5;pointer-events:none;"></div>`;}
        for(let c=1;c<cols;c++){const cx=+(startX+c*sw).toFixed(2);html+=`<div style="position:absolute;top:${startY}mm;left:${cx}mm;height:${contentH}mm;border-left:.25mm dashed #aaa;z-index:5;pointer-events:none;"></div>`;}
        html+=cropMarksHTML;
        div.innerHTML=html;
        container.appendChild(div);
      });
    }
  } else {
    sides.forEach(s=>{
      const div=document.createElement('div');
      const isBack=s.lbl.includes('Back');
      div.className='sheet'+(flipShort&&isBack?' flip-back':'');
      let cropMarks='';
      if(opts.cropmarks){
        cropMarks=`
          <div class="crop-mark v-mark" style="top:-10mm;left:-.2mm;"></div>
          <div class="crop-mark v-mark" style="top:-10mm;left:calc(${sz.w}mm - .2mm);"></div>
          <div class="crop-mark v-mark" style="top:-10mm;right:-.2mm;"></div>
          <div class="crop-mark v-mark" style="bottom:-10mm;left:-.2mm;"></div>
          <div class="crop-mark v-mark" style="bottom:-10mm;left:calc(${sz.w}mm - .2mm);"></div>
          <div class="crop-mark v-mark" style="bottom:-10mm;right:-.2mm;"></div>
          <div class="crop-mark h-mark" style="left:-10mm;top:-.2mm;"></div>
          <div class="crop-mark h-mark" style="left:-10mm;bottom:-.2mm;"></div>
          <div class="crop-mark h-mark" style="right:-10mm;top:-.2mm;"></div>
          <div class="crop-mark h-mark" style="right:-10mm;bottom:-.2mm;"></div>`;
      }
      const foldLine=opts.foldline?'<div class="fold-line"></div>':'';
      div.innerHTML=`
        <div class="sheet-label">${s.lbl}</div>
        ${foldLine}
        <div class="spread-container">
          ${s.l}${s.r}
          ${cropMarks}
        </div>`;
      container.appendChild(div);
    });
  }

  if(separateCovers.length>0){
    const div=document.createElement('div');
    div.className='sheet';
    const leftHTML=separateCovers.find(c=>c.lbl.includes('Back'))?.html||`<div class="pg" style="width:${sz.w}mm;height:${sz.h}mm;background-color:${colors.page};"></div>`;
    const rightHTML=separateCovers.find(c=>c.lbl.includes('Cover ('))?.html||leftHTML;
    let cropMarks='';
    if(opts.cropmarks){
      cropMarks=`
        <div class="crop-mark v-mark" style="top:-10mm;left:-.2mm;"></div>
        <div class="crop-mark v-mark" style="top:-10mm;left:calc(${sz.w}mm - .2mm);"></div>
        <div class="crop-mark v-mark" style="top:-10mm;right:-.2mm;"></div>
        <div class="crop-mark v-mark" style="bottom:-10mm;left:-.2mm;"></div>
        <div class="crop-mark v-mark" style="bottom:-10mm;left:calc(${sz.w}mm - .2mm);"></div>
        <div class="crop-mark v-mark" style="bottom:-10mm;right:-.2mm;"></div>
        <div class="crop-mark h-mark" style="left:-10mm;top:-.2mm;"></div>
        <div class="crop-mark h-mark" style="left:-10mm;bottom:-.2mm;"></div>
        <div class="crop-mark h-mark" style="right:-10mm;top:-.2mm;"></div>
        <div class="crop-mark h-mark" style="right:-10mm;bottom:-.2mm;"></div>`;
    }
    const foldLine=opts.foldline?'<div class="fold-line"></div>':'';
    div.innerHTML=`
      <div class="sheet-label">Cover Sheet (separate — print on cardstock)</div>
      ${foldLine}
      <div class="spread-container">
        ${leftHTML}${rightHTML}
        ${cropMarks}
      </div>`;
    container.appendChild(div);
  }

  if(opts.printGuide){
    container.appendChild(mkPrintGuide(n, sides.length));
  }

  const physSides=layout2up?Math.ceil(sides.length/layout2up.spreadsPerSide):sides.length;
  const coverNote=separateCovers.length>0?' + 1 cover sheet':'';
  const upNote=layout2up?` · ${layout2up.spreadsPerSide}-up`:'';
  $('pg-count').textContent=`${n+separateCovers.length} pages · ${physSides} print sides${upNote}${coverNote} · fold · staple spine · trim`;
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
const now=new Date();
$('sel-m').value=now.getMonth();
$('sel-y').value=now.getFullYear();

if(!loadState()){
  habits=[
    {icon:'droplets',name:'Water',days:[0,1,2,3,4,5,6],id:1},
    {icon:'dumbbell',name:'Exercise',days:[0,2,4],id:2},
    {icon:'book-open',name:'Read',days:[0,1,2,3,4,5,6],id:3},
    {icon:'brain',name:'Meditate',days:[0,1,2,3,4,5,6],id:4},
  ];
}

applyOptsToUI();
buildThemeGrid();
buildColorOverrides();
renderMetrics();
renderDailyFields();
renderHolidays();
renderHabits();
renderBottomBoxes();
buildDayPick();
lucide.createIcons();

$('sel-m').addEventListener('change',()=>generate());
$('sel-y').addEventListener('change',()=>generate());
$('h-name').addEventListener('keydown',e=>{if(e.key==='Enter')addHabit();});
$('box-title-inp').addEventListener('keydown',e=>{if(e.key==='Enter')addBottomBox();});
$('metric-name').addEventListener('keydown',e=>{if(e.key==='Enter')addMetric();});
$('daily-field-name').addEventListener('keydown',e=>{if(e.key==='Enter')addDailyField();});
if($('holiday-name')) $('holiday-name').addEventListener('keydown',e=>{if(e.key==='Enter')addHoliday();});

$('page-preview').addEventListener('click',function(e){
  let node=e.target;
  inspectorContext={habitId:null,fieldId:null};
  while(node&&node!==this){
    for(const m of INSPECTOR_MAP){
      if(node.classList.contains(m.cls)){
        let ctx=node;
        while(ctx&&ctx!==this){
          if(ctx.dataset.habitId) inspectorContext.habitId=parseInt(ctx.dataset.habitId);
          if(ctx.dataset.fieldId) inspectorContext.fieldId=parseInt(ctx.dataset.fieldId);
          ctx=ctx.parentElement;
        }
        buildInspector(m);
        if(window.innerWidth<=768) showMobileInspector();
        return;
      }
    }
    node=node.parentElement;
  }
  closeInspector();
});

document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeInspector(); });

// Ctrl+wheel zoom
$('preview').addEventListener('wheel',e=>{
  if(!e.ctrlKey) return;
  e.preventDefault();
  adjustZoom(e.deltaY<0?0.1:-0.1);
},{passive:false});

// Pinch-to-zoom
let _pinchDist=null;
$('preview').addEventListener('touchstart',e=>{
  if(e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    _pinchDist=Math.hypot(dx,dy);
  }
},{passive:true});
$('preview').addEventListener('touchmove',e=>{
  if(e.touches.length!==2||_pinchDist===null) return;
  e.preventDefault();
  const dx=e.touches[0].clientX-e.touches[1].clientX;
  const dy=e.touches[0].clientY-e.touches[1].clientY;
  const dist=Math.hypot(dx,dy);
  const delta=(dist-_pinchDist)/200;
  _pinchDist=dist;
  adjustZoom(delta);
},{passive:false});
$('preview').addEventListener('touchend',()=>{ _pinchDist=null; },{passive:true});

generate();
setView(currentView);

// If holidays already enabled, pull worldwide library + full country list, then refresh.
if(opts.holidays){
  ensureHolidayLib().then(ok=>{ if(ok){ populateHolidayCountries(); applyOptsToUI(); generate(); } });
}
