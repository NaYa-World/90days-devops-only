// ═══════════════════════════════════════════════════════════════
// 90 Days of DevOps v2 — App.js
// New: XP/Levels, Spaced Repetition, Streak Freeze, Smart Next,
//      AI Daily Brief, Job Tracker, Q-Bank, GitHub, ETA Band,
//      Phase Celebrations, Keyboard Shortcuts, Bulk Actions
// ═══════════════════════════════════════════════════════════════

load();
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  buildPhaseFilters();
  renderAll();
  bindNav();
  bindSearch();
  bindPomodoro();
  bindReport();
  bindJobs();
  bindQbank();
  bindGithub();
  bindKeyboard();
  setInterval(updateStats, 600);
});

// ── VIEW ROUTING ──────────────────────────────────────────────────────────────
let curView = 'roadmap';
function switchView(v) {
  curView = v;
  document.querySelectorAll('.view').forEach(function(el){ el.classList.remove('active'); });
  const el = document.getElementById('view-'+v);
  if(el) el.classList.add('active');
  document.querySelectorAll('.nav-tab,.btab').forEach(function(b){
    b.classList.toggle('active', b.dataset.view === v);
  });
  if(v==='kanban')  renderKanban();
  if(v==='focus')   renderFocusFromSel();
  if(v==='reviews') renderReviews();
  if(v==='stats')   renderStats();
  if(v==='report')  renderReport();
  if(v==='jobs')    renderJobs();
  if(v==='qbank')   renderQbank();
  if(v==='labs')    renderLabs();
  if(v==='certs')   renderCerts();
  if(v==='weekly')  renderWeeklyGoals();
}
function bindNav() {
  document.querySelectorAll('.nav-tab,.btab').forEach(function(b){
    b.addEventListener('click', function(){ switchView(b.dataset.view); });
  });
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
}

// ── THEME ─────────────────────────────────────────────────────────────────────
function initTheme() {
  const t = localStorage.getItem('devops90_theme') || 'dark';
  if(t==='light'){ document.documentElement.setAttribute('data-theme','light'); document.getElementById('theme-btn').textContent='◑ Dark'; }
}
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme')==='light';
  if(isLight){
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-btn').textContent='◑ Light';
    localStorage.setItem('devops90_theme','dark');
  } else {
    document.documentElement.setAttribute('data-theme','light');
    document.getElementById('theme-btn').textContent='◑ Dark';
    localStorage.setItem('devops90_theme','light');
  }
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
function bindKeyboard() {
  document.addEventListener('keydown', function(e) {
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.key==='/'){ e.preventDefault(); document.getElementById('search-input').focus(); return; }
    if(e.key==='p'||e.key==='P'){ document.getElementById('pomo-modal').classList.toggle('open'); return; }
    if(curView==='focus'){
      if(e.key==='j'||e.key==='J') document.getElementById('focus-next').click();
      if(e.key==='k'||e.key==='K') document.getElementById('focus-prev').click();
    }
  });
}

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
let curFilter='all', curSearch='', curTypes=[], curStatus='', reportWeekOffset=0, kbPhase='all';
let qbCat='all', qbDiff='', qbSearch='';

// ── PHASE FILTERS ────────────────────────────────────────────────────────────
function buildPhaseFilters() {
  ['filter-bar','kb-filter-bar'].forEach(function(barId){
    const bar=document.getElementById(barId); if(!bar) return;
    PHASES.forEach(function(ph,pi){
      const btn=document.createElement('button');
      btn.className='fpill'; btn.dataset.phase=pi;
      btn.textContent=ph.title.split(' — ')[1]||ph.title;
      bar.appendChild(btn);
    });
    bar.querySelectorAll('.fpill').forEach(function(btn){
      btn.addEventListener('click', function(){
        bar.querySelectorAll('.fpill').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        if(barId==='filter-bar'){ curFilter=btn.dataset.phase; renderRoadmap(); }
        else{ kbPhase=btn.dataset.phase; renderKanban(); }
      });
    });
  });
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
function bindSearch() {
  const inp=document.getElementById('search-input');
  const clr=document.getElementById('search-clear');
  inp.addEventListener('input', function(){ curSearch=inp.value; renderRoadmap(); });
  clr.addEventListener('click', function(){
    inp.value=''; curSearch=''; curTypes=[]; curStatus='';
    document.querySelectorAll('.sf-chip').forEach(function(c){ c.classList.remove('active'); });
    renderRoadmap();
  });
  document.querySelectorAll('.sf-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      chip.classList.toggle('active');
      const val=chip.dataset.val;
      const types=['concept','code','quiz','project'];
      if(types.includes(val)){
        if(curTypes.includes(val)) curTypes=curTypes.filter(function(t){ return t!==val; });
        else curTypes.push(val);
      } else {
        curStatus = curStatus===val ? '' : val;
        document.querySelectorAll('.sf-chip.f-status').forEach(function(c){
          c.classList.toggle('active', c.dataset.val===curStatus);
        });
      }
      renderRoadmap();
    });
  });
}

// ── STATS UPDATE ──────────────────────────────────────────────────────────────
function updateStats() {
  const done=cntDone(), total=cntTotal(), pct=total?Math.round(done/total*100):0;
  const streak=S._streak||0;
  const hours=studyHours();
  document.querySelectorAll('[data-stat="done"]').forEach(function(el){ el.textContent=done; });
  document.querySelectorAll('[data-stat="left"]').forEach(function(el){ el.textContent=total-done; });
  document.querySelectorAll('[data-stat="total"]').forEach(function(el){ el.textContent=total; });
  document.querySelectorAll('[data-stat="pct"]').forEach(function(el){ el.textContent=pct+'%'; });
  document.querySelectorAll('[data-stat="prog-lbl"]').forEach(function(el){ el.textContent=pct+'%'; });
  document.querySelectorAll('[data-stat="streak"]').forEach(function(el){ el.textContent=streak; });
  document.querySelectorAll('[data-stat="hours"]').forEach(function(el){ el.textContent=hours+'h'; });
  const fill=document.getElementById('main-prog-fill');
  if(fill) fill.style.width=pct+'%';

  // XP / Level
  const xp=calcXP();
  const {lvl,next,pct:xpPct}=getLevel(xp);
  const badge=document.getElementById('xp-level-badge');
  if(badge){ badge.textContent=lvl.title; badge.style.color=lvl.color; badge.style.borderColor=lvl.color; badge.style.background='rgba('+hexToRgb(lvl.color)+',.07)'; }
  const xpFill=document.getElementById('xp-fill');
  if(xpFill) xpFill.style.width=xpPct+'%';
  const xpTotal=document.getElementById('xp-total');
  if(xpTotal) xpTotal.textContent=xp+' XP';
  const xpLvlName=document.getElementById('xp-level-name');
  if(xpLvlName) xpLvlName.textContent=lvl.title;
  const xpNext=document.getElementById('xp-next-label');
  if(xpNext) xpNext.textContent=next?(next.min-xp)+' XP to '+next.title:'MAX LEVEL 🎉';

  // Streak display
  // weekly goal mini bar
  const wgFill=document.getElementById('wgm-fill');
  const wgNums=document.getElementById('wgm-nums');
  if(typeof getWeekDone==='function'){
    const weekDone=getWeekDone(),weekGoal=getWeekGoal(),weekPct=getWeekPct();
    if(wgFill) wgFill.style.width=weekPct+'%';
    if(wgNums) wgNums.textContent=weekDone+' / '+weekGoal;
  }
  const sd=document.getElementById('streak-display');
  if(sd) sd.textContent=streak+' day streak';

  // Freeze button

  // SR due badge
  const dueReviews=getDueReviews();
  const srBadge=document.getElementById('sr-due-badge');
  const srCount=document.getElementById('sr-due-count');
  if(srBadge){ srBadge.style.display=dueReviews.length>0?'block':'none'; }
  if(srCount){ srCount.textContent=dueReviews.length; }

  // Smart next
  const next2=getSmartNext();
  const sntTitle=document.getElementById('smart-next-title');
  const sntMeta=document.getElementById('smart-next-meta');
  if(sntTitle&&next2){ sntTitle.textContent=next2.d.day+' — '+next2.d.label; }
  if(sntMeta&&next2){ sntMeta.textContent=next2.ph.title.split(' — ')[1]+' · '+dayDone(next2.pi,next2.di)+'/'+dayTotal(next2.pi,next2.di)+' tasks done'; }

  // ETA banner
  const msg=document.getElementById('left-msg');
  if(msg){
    if(done===0) msg.textContent='Start your 90-day DevOps journey today. Mark your first task done!';
    else if(done===total) msg.textContent='🎉 All 90 days complete! You are a DevOps engineer.';
    else {
      const eta=calcETA();
      if(eta) msg.textContent='At '+eta.avgPerDay+' tasks/day → finish in ~'+eta.daysLeft+' days (est. '+eta.eta+')';
      else msg.textContent=(total-done)+' tasks to go. Keep the streak alive!';
    }
  }
  recordToday(done);
}

function hexToRgb(hex) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}

// ── STREAK FREEZE ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){

  // Smart next click
  const snc=document.getElementById('smart-next-card');
  if(snc) snc.addEventListener('click', function(){
    const next=getSmartNext();
    if(!next) return;
    const sel=document.getElementById('focus-day-sel');
    if(sel){ sel.value=next.pi+'_'+next.di; }
    switchView('focus');
  });
});

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, color) {
  const t=document.createElement('div');
  t.style=`position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${color||'var(--s1)'};border:1px solid var(--border);color:var(--text);font-family:var(--mono);font-size:12px;padding:10px 18px;border-radius:var(--r8);z-index:400;box-shadow:0 4px 20px rgba(0,0,0,.4);white-space:nowrap`;
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(function(){ t.remove(); },400); },2500);
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function fireConfetti() {
  const wrap=document.createElement('div'); wrap.className='confetti-wrap';
  const colors=['#00d9a0','#4fa8ff','#ffc850','#c084fc','#f97316','#ff5f5f'];
  for(let i=0;i<60;i++){
    const c=document.createElement('div'); c.className='confetto';
    c.style.left=Math.random()*100+'vw';
    c.style.background=colors[Math.floor(Math.random()*colors.length)];
    c.style.animationDelay=(Math.random()*1.5)+'s';
    c.style.animationDuration=(2+Math.random()*2)+'s';
    c.style.width=(6+Math.random()*8)+'px';
    c.style.height=(6+Math.random()*8)+'px';
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(function(){ wrap.remove(); },5000);
}

// ── RENDER ALL ────────────────────────────────────────────────────────────────
function renderAll() {
  renderRoadmap();
  buildFocusSelect();
  updateStats();
}

// ── VIEW 1: ROADMAP ───────────────────────────────────────────────────────────
function renderRoadmap() {
  const wrap=document.getElementById('roadmap-wrap'); if(!wrap) return;
  wrap.innerHTML='';
  const sl=curSearch.toLowerCase();
  PHASES.forEach(function(ph,pi){
    if(curFilter!=='all'&&parseInt(curFilter)!==pi) return;
    const phTotal=ph.data.reduce(function(a,d,di){ return a+dayTotal(pi,di); },0);
    const phDone=ph.data.reduce(function(a,d,di){ return a+dayDone(pi,di); },0);
    const phPct=phTotal?Math.round(phDone/phTotal*100):0;
    const isOpen=S['po'+pi]!==false, isComp=phDone===phTotal&&phTotal>0;
    const card=document.createElement('div'); card.className='phase-card';
    card.style.setProperty('--pc',ph.color); card.style.setProperty('--pcd',ph.dim);
    card.innerHTML=
      '<div class="phase-hdr" id="phdr'+pi+'">'
        +'<div class="phase-icon">'+ph.icon+'</div>'
        +'<div style="flex:1;min-width:0">'
          +'<div class="phase-title">'+ph.title+'</div>'
          +'<div class="phase-meta">'+ph.days+' · '+phDone+'/'+phTotal+' tasks</div>'
          +'<div class="mini-bar"><div class="mini-fill" style="width:'+phPct+'%;background:'+ph.color+'"></div></div>'
        +'</div>'
        +(isComp?'<div class="done-pill">✓ done</div>':'<span style="font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:8px;background:var(--s3);color:var(--sub)">'+phPct+'%</span>')
        +'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--sub);flex-shrink:0;transition:transform .3s;transform:rotate('+(isOpen?180:0)+'deg)" id="ch'+pi+'"><polyline points="6 9 12 15 18 9"/></svg>'
      +'</div>'
      +'<div class="phase-body'+(isOpen?' open':'')+'" id="pb'+pi+'"><div class="phase-body-inner"><div class="phase-inner" id="pbi'+pi+'"></div></div></div>';
    card.querySelector('#phdr'+pi).addEventListener('click', function(){ togglePhase(pi); });
    const inner=card.querySelector('#pbi'+pi);
    ph.data.forEach(function(d,di){
      const typeOk=curTypes.length===0||d.tasks.some(function(t){ return curTypes.includes(t.k); });
      const statusOk=!curStatus||(curStatus==='incomplete'?dayDone(pi,di)<dayTotal(pi,di):dayDone(pi,di)===dayTotal(pi,di));
      const textOk=!sl||d.tasks.some(function(t){ return t.t.toLowerCase().includes(sl); })||d.label.toLowerCase().includes(sl)||d.day.toLowerCase().includes(sl);
      if(!typeOk||!statusOk||!textOk) return;
      inner.appendChild(buildDayBlock(pi,di,d));
    });
    wrap.appendChild(card);
  });
}

function togglePhase(pi){ S['po'+pi]=S['po'+pi]===false?true:false; save(); renderRoadmap(); }

function buildDayBlock(pi,di,d) {
  const dDone=dayDone(pi,di),dTotal=dayTotal(pi,di),allDone=dDone===dTotal;
  const dayOpen=S['do'+pi+'_'+di]!==false;
  const avgConf=dayAvgConf(pi,di);
  const block=document.createElement('div'); block.className='day-block'+(allDone?' all-done':'');
  const hdr=document.createElement('div'); hdr.className='day-hdr';
  hdr.innerHTML='<span class="day-tag">'+d.day+'</span><span class="day-label">'+d.label+'</span>'
    +'<span class="day-count" style="color:'+(allDone?'var(--green)':'var(--sub)')+'">'+dDone+'/'+dTotal+(allDone?' ✓':'')+(hasNote(pi,di)?' 📝':'')+(avgConf>0?' ⭐'+avgConf.toFixed(1):'')+'</span>'
    +'<svg class="day-chev'+(dayOpen?' open':'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
  const tasksWrap=document.createElement('div'); tasksWrap.className='day-tasks'+(dayOpen?' open':'');
  const inner=document.createElement('div'); inner.className='day-tasks-inner';
  // Bulk actions
  const bulk=document.createElement('div'); bulk.className='bulk-actions';
  const bulkConcept=document.createElement('button'); bulkConcept.className='bulk-btn'; bulkConcept.textContent='✓ All Concepts';
  bulkConcept.addEventListener('click', function(){ bulkMark(pi,di,'concept'); });
  const bulkCode=document.createElement('button'); bulkCode.className='bulk-btn'; bulkCode.textContent='✓ All Code';
  bulkCode.addEventListener('click', function(){ bulkMark(pi,di,'code'); });
  const bulkAll=document.createElement('button'); bulkAll.className='bulk-btn'; bulkAll.textContent='✓ All Tasks';
  bulkAll.style.color='var(--green)';
  bulkAll.addEventListener('click', function(){ bulkMark(pi,di,'all'); });
  bulk.appendChild(bulkConcept); bulk.appendChild(bulkCode); bulk.appendChild(bulkAll);
  inner.appendChild(bulk);
  d.tasks.forEach(function(task,ti){ inner.appendChild(makeTaskRow(pi,di,ti,task,false)); });
  inner.appendChild(buildNotesWidget(pi,di));
  inner.appendChild(buildAIBriefWidget(pi,di));
  tasksWrap.appendChild(inner);
  hdr.addEventListener('click', function(){
    const open=tasksWrap.classList.toggle('open');
    S['do'+pi+'_'+di]=open; save();
    hdr.querySelector('.day-chev').classList.toggle('open',open);
  });
  block.appendChild(hdr); block.appendChild(tasksWrap);
  return block;
}

function bulkMark(pi,di,type) {
  let changed=false;
  PHASES[pi].data[di].tasks.forEach(function(task,ti){
    if(type==='all'||task.k===type){ if(!S[tid(pi,di,ti)]){ S[tid(pi,di,ti)]=true; changed=true; } }
  });
  if(changed){
    save(); renderRoadmap(); updateStats();
    const wasComp=checkPhaseJustCompleted(pi);
    if(wasComp){ fireConfetti(); showToast('🎉 Phase complete! Great work!','rgba(0,217,160,.15)'); }
  }
}

function makeTaskRow(pi,di,ti,task,inFocus) {
  const id=tid(pi,di,ti); const done=!!S[id]; const conf=getConf(pi,di,ti);
  const row=document.createElement('div'); row.className='task-row';
  const check=document.createElement('div'); check.className='task-check'+(done?' done':'');
  check.addEventListener('click', function(){
    const nowDone=!S[id]; S[id]=nowDone; save();
    check.classList.toggle('done',nowDone); txt.classList.toggle('done',nowDone);
    xpEl.style.opacity=nowDone?'1':'0';
    updateStats();
    if(nowDone){ scheduleSR(pi,di,ti, conf||3); } // schedule SR on completion
    const wasComp=checkPhaseJustCompleted(pi);
    if(wasComp){ fireConfetti(); showToast('🎉 Phase complete! Excellent work!','rgba(0,217,160,.15)'); }
  });
  const txt=document.createElement('span'); txt.className='task-text'+(done?' done':''); txt.textContent=task.t;
  const badge=document.createElement('span'); badge.className='task-badge badge-'+task.k; badge.textContent=task.k;
  const xpEl=document.createElement('span'); xpEl.className='task-xp'; xpEl.textContent='+'+XP_MAP[task.k]+'xp'; xpEl.style.opacity=done?'1':'0';
  const confRow=document.createElement('div'); confRow.className='conf-row';
  confRow.innerHTML='<span class="conf-label">conf:</span>';
  [1,2,3,4,5].forEach(function(v){
    const star=document.createElement('span'); star.className='conf-star'+(conf>=v?' on':''); star.textContent='★';
    star.addEventListener('click', function(){
      const newConf=conf===v?0:v; setConf(pi,di,ti,newConf);
      if(S[id]) scheduleSR(pi,di,ti,newConf);
      if(inFocus) renderFocusFromSel(); else renderRoadmap();
    });
    confRow.appendChild(star);
  });
  const mid=document.createElement('div'); mid.style.flex='1';
  mid.appendChild(txt); mid.appendChild(confRow);
  const right=document.createElement('div'); right.style='display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0';
  right.appendChild(badge); right.appendChild(xpEl);
  row.appendChild(check); row.appendChild(mid); row.appendChild(right);
  return row;
}

function buildNotesWidget(pi,di) {
  const wrap=document.createElement('div'); wrap.className='notes-widget';
  wrap.innerHTML='<div class="notes-label">📝 NOTES</div>';
  const ta=document.createElement('textarea'); ta.className='notes-ta';
  ta.placeholder='Add your notes, links, or reflections…'; ta.value=getNote(pi,di);
  const btn=document.createElement('button'); btn.className='notes-save'; btn.textContent='Save note';
  btn.addEventListener('click', function(){ setNote(pi,di,ta.value); btn.textContent='✓ Saved'; setTimeout(function(){ btn.textContent='Save note'; },1500); });
  wrap.appendChild(ta); wrap.appendChild(btn); return wrap;
}

function buildAIBriefWidget(pi,di) {
  const wrap=document.createElement('div'); wrap.className='ai-brief-wrap';
  wrap.innerHTML='<div class="ai-brief-hdr">'
    +'<div class="ai-brief-title">✦ AI Daily Brief</div>'
    +'<div class="ai-brief-btns">'
      +'<button class="ai-btn ai-btn-brief" id="ai-brief-btn-'+pi+'_'+di+'">Generate Brief</button>'
      +'<button class="ai-btn ai-btn-quiz" id="ai-quiz-btn-'+pi+'_'+di+'">AI Quiz</button>'
    +'</div>'
    +'</div>'
    +'<div class="ai-brief-body" id="ai-brief-content-'+pi+'_'+di+'"><span style="color:var(--muted);font-size:12px">Click "Generate Brief" for an AI-powered study plan for today\'s topics.</span></div>'
    +'<div style="padding:0 14px 14px" id="ai-quiz-content-'+pi+'_'+di+'"></div>';
  setTimeout(function(){
    const bb=document.getElementById('ai-brief-btn-'+pi+'_'+di);
    const qb=document.getElementById('ai-quiz-btn-'+pi+'_'+di);
    if(bb) bb.addEventListener('click', function(){
      const body=document.getElementById('ai-brief-content-'+pi+'_'+di);
      if(body) { const orig=body; generateAIBrief_with_el(pi,di,orig); }
    });
    if(qb) qb.addEventListener('click', function(){
      const body=document.getElementById('ai-quiz-content-'+pi+'_'+di);
      if(body) generateAIQuiz_with_el(pi,di,body);
    });
  },100);
  return wrap;
}

// Bridge functions for DOM element passing
async function generateAIBrief_with_el(pi,di,container) {
  const ph=PHASES[pi],d=ph.data[di];
  const tasks=d.tasks.map(function(t){ return '- ['+t.k+'] '+t.t; }).join('\n');
  const doneCount=dayDone(pi,di),totalCount=dayTotal(pi,di);
  const note=getNote(pi,di);
  const prompt=`You are a DevOps mentor helping an engineer study the 90 Days of DevOps curriculum.
Today's focus: ${d.day} — "${d.label}" (Phase: ${ph.title})
Progress: ${doneCount}/${totalCount} tasks complete
Tasks for today:
${tasks}
${note?'Student notes: '+note:''}
Provide a concise, practical daily brief:
## 🎯 What You'll Learn Today
2-3 sentences on core value.
## ⚡ Key Concepts to Nail
3-4 bullets with one-line explanations.
## 🛠 Hands-On Focus
The single most important practical exercise and why.
## 🔗 How This Connects
One sentence connecting to the bigger picture.
## ❓ Self-Check Question
One challenging question the student should answer after completion.
Be specific to the exact tools and concepts listed. Avoid generic advice.`;
  container.innerHTML='<div style="display:flex;align-items:center;gap:10px;color:var(--sub);font-size:13px"><div class="ai-spinner"></div>Generating your daily brief…</div>';
  try {
    const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
    const data=await response.json();
    const text=data.content&&data.content[0]?data.content[0].text:'Could not generate brief.';
    container.innerHTML=renderMarkdown(text);
  } catch(e){ container.innerHTML='<div style="color:var(--red);font-size:13px">⚠ Could not connect. Check network.</div>'; }
}

async function generateAIQuiz_with_el(pi,di,container) {
  const ph=PHASES[pi],d=ph.data[di];
  const tasks=d.tasks.map(function(t){ return t.t; }).join(', ');
  const prompt=`Generate a single challenging scenario-based quiz question for DevOps engineers studying: "${d.label}" covering: ${tasks}\nReturn ONLY valid JSON (no markdown backticks):\n{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":0,"explanation":"..."}\nWhere answer is the 0-based index of the correct option. Make distractors plausible.`;
  container.innerHTML='<div style="display:flex;align-items:center;gap:10px;color:var(--sub);font-size:13px"><div class="ai-spinner"></div>Generating quiz question…</div>';
  try {
    const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:prompt}]})});
    const data=await response.json();
    let text=data.content&&data.content[0]?data.content[0].text:'';
    text=text.replace(/```json|```/g,'').trim();
    const quiz=JSON.parse(text);
    renderAIQuiz(quiz,container);
  } catch(e){ container.innerHTML='<div style="color:var(--red);font-size:13px">⚠ Could not generate quiz. Try again.</div>'; }
}

function renderMarkdown(text) {
  return text
    .replace(/## (.+)/g,'<h3 style="font-size:13px;font-weight:700;margin:14px 0 7px;color:var(--text)">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--text)">$1</strong>')
    .replace(/^- (.+)/gm,'<li style="margin-bottom:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g,'<ul style="padding-left:16px;margin:5px 0">$&</ul>')
    .replace(/\n\n/g,'<br>')
    .replace(/\n/g,'<br>');
}

// ── VIEW 2: KANBAN ────────────────────────────────────────────────────────────
function renderKanban() {
  const wrap=document.getElementById('kanban-wrap'); if(!wrap) return; wrap.innerHTML='';
  const cols={backlog:[],inprogress:[],review:[],done:[]};
  PHASES.forEach(function(ph,pi){
    if(kbPhase!=='all'&&parseInt(kbPhase)!==pi) return;
    ph.data.forEach(function(d,di){ cols[dayStatus(pi,di)].push({ph,pi,d,di}); });
  });
  [{key:'backlog',label:'Backlog',emoji:'○'},{key:'inprogress',label:'In Progress',emoji:'◑'},{key:'review',label:'Review',emoji:'◕'},{key:'done',label:'Done',emoji:'●'}]
  .forEach(function(col){
    const colEl=document.createElement('div'); colEl.className='k-col';
    const items=cols[col.key];
    colEl.innerHTML='<div class="k-col-hdr"><span class="k-col-title">'+col.emoji+' '+col.label+'</span><span class="k-count">'+items.length+'</span></div>';
    const body=document.createElement('div'); body.className='k-body';
    if(!items.length){ body.innerHTML='<div class="k-empty">Empty</div>'; }
    else{
      items.forEach(function(item){
        const card=document.createElement('div'); card.className='k-card'; card.style.setProperty('--kc',item.ph.color);
        const dDone=dayDone(item.pi,item.di),dTotal=dayTotal(item.pi,item.di),pct=dTotal?Math.round(dDone/dTotal*100):0;
        card.innerHTML='<div class="k-card-day">'+item.d.day+'</div><div class="k-card-label">'+item.d.label+'</div><div class="k-card-pct">'+dDone+'/'+dTotal+' ('+pct+'%)</div>';
        card.addEventListener('click', function(){
          const sel=document.getElementById('focus-day-sel');
          if(sel){ sel.value=item.pi+'_'+item.di; } switchView('focus');
        });
        body.appendChild(card);
      });
    }
    colEl.appendChild(body); wrap.appendChild(colEl);
  });
}

// ── VIEW 3: FOCUS ─────────────────────────────────────────────────────────────
function buildFocusSelect() {
  const sel=document.getElementById('focus-day-sel'); if(!sel) return; sel.innerHTML='';
  PHASES.forEach(function(ph,pi){
    ph.data.forEach(function(d,di){
      const opt=document.createElement('option'); opt.value=pi+'_'+di;
      opt.textContent=d.day+' — '+d.label; sel.appendChild(opt);
    });
  });
  sel.addEventListener('change', renderFocusFromSel);
  document.getElementById('focus-prev').addEventListener('click', function(){
    const all=getAllDayIndices(),cur=sel.value,idx=all.indexOf(cur);
    if(idx>0){ sel.value=all[idx-1]; renderFocusFromSel(); }
  });
  document.getElementById('focus-next').addEventListener('click', function(){
    const all=getAllDayIndices(),cur=sel.value,idx=all.indexOf(cur);
    if(idx<all.length-1){ sel.value=all[idx+1]; renderFocusFromSel(); }
  });
  document.getElementById('focus-today').addEventListener('click', function(){
    const next=getSmartNext();
    if(next){ sel.value=next.pi+'_'+next.di; renderFocusFromSel(); }
  });
}
function getAllDayIndices() {
  const out=[]; PHASES.forEach(function(ph,pi){ ph.data.forEach(function(d,di){ out.push(pi+'_'+di); }); }); return out;
}
function renderFocusFromSel() {
  const sel=document.getElementById('focus-day-sel'); if(!sel) return;
  const parts=sel.value.split('_');
  renderFocusDay(parseInt(parts[0]),parseInt(parts[1]));
}
function renderFocusDay(pi,di) {
  const content=document.getElementById('focus-content'); if(!content) return;
  const ph=PHASES[pi],d=ph.data[di];
  const dDone=dayDone(pi,di),dTotal=dayTotal(pi,di),pct=dTotal?Math.round(dDone/dTotal*100):0;
  content.innerHTML='';
  const card=document.createElement('div'); card.className='focus-card';
  card.innerHTML='<div class="focus-day-tag">'+d.day+' · '+ph.title.split(' — ')[1]+'</div>'
    +'<div class="focus-title">'+d.label+'</div>'
    +'<div class="focus-meta">'+dDone+'/'+dTotal+' tasks · '+pct+'% done · '+calcXP()+' XP total</div>'
    +'<div class="focus-pct-bar"><div class="focus-pct-fill" style="width:'+pct+'%"></div></div>'
    +(d.link?'<a href="'+d.link+'" target="_blank" class="focus-link">🔗 View on 90DaysOfDevOps →</a>':'');
  d.tasks.forEach(function(task,ti){ card.appendChild(makeTaskRow(pi,di,ti,task,true)); });
  card.appendChild(buildNotesWidget(pi,di));
  card.appendChild(buildAIBriefWidget(pi,di));
  content.appendChild(card);
}

// ── VIEW 4: REVIEWS (SPACED REPETITION) ──────────────────────────────────────
function renderReviews() {
  const content=document.getElementById('reviews-content'); if(!content) return;
  content.innerHTML='';
  const due=getDueReviews();
  if(!due.length){
    content.innerHTML='<div style="background:var(--s1);border:1px solid var(--border);border-radius:var(--r12);padding:24px;text-align:center"><div style="font-size:36px;margin-bottom:10px">✅</div><div style="font-weight:600;margin-bottom:6px">No reviews due!</div><div style="color:var(--sub);font-size:13px">Rate tasks ★1–2 on completion to schedule them for review. They\'ll appear here when due.</div></div>';
    return;
  }
  const hdr=document.createElement('div'); hdr.style='font-family:var(--mono);font-size:12px;color:var(--sub);margin-bottom:14px';
  hdr.textContent=due.length+' task'+(due.length>1?'s':'')+' due for review today';
  content.appendChild(hdr);
  due.forEach(function(item){
    const card=document.createElement('div'); card.className='sr-item';
    card.innerHTML='<div style="flex:1"><div class="sr-item-text">'+item.task.t+'</div>'
      +'<div class="sr-item-meta">'+item.d.day+' · '+item.ph.title.split(' — ')[1]+' · last rated ★'+item.sr.conf+'</div>'
      +'<div class="sr-rate-row" id="srr-'+item.pi+'_'+item.di+'_'+item.ti+'"></div></div>';
    content.appendChild(card);
    const rateRow=card.querySelector('#srr-'+item.pi+'_'+item.di+'_'+item.ti);
    const label=document.createElement('span'); label.style='font-family:var(--mono);font-size:10px;color:var(--muted);margin-right:4px'; label.textContent='Re-rate:';
    rateRow.appendChild(label);
    [1,2,3,4,5].forEach(function(v){
      const btn=document.createElement('button'); btn.className='sr-rate-btn';
      const col=v<=2?'var(--red)':v===3?'var(--amber)':'var(--green)';
      btn.style='color:'+col+';border-color:'+col+';background:none';
      btn.textContent='★'+v;
      btn.addEventListener('click', function(){
        markSRReviewed(item.pi,item.di,item.ti,v);
        showToast('Scheduled for review in '+SR_INTERVALS[Math.min(v-1,SR_INTERVALS.length-1)]+' days','rgba(0,217,160,.1)');
        renderReviews();
      });
      rateRow.appendChild(btn);
    });
  });
}

// ── VIEW 5: JOBS ──────────────────────────────────────────────────────────────
function bindJobs() {
  document.getElementById('jt-save').addEventListener('click', function(){
    const company=document.getElementById('jt-company').value.trim();
    const role=document.getElementById('jt-role').value.trim();
    if(!company||!role){ showToast('Company and Role are required'); return; }
    addJob({company,role,source:document.getElementById('jt-source').value,notes:document.getElementById('jt-notes').value.trim()});
    document.getElementById('jt-company').value='';
    document.getElementById('jt-role').value='';
    document.getElementById('jt-notes').value='';
    renderJobs();
  });
}
function renderJobs() {
  const wrap=document.getElementById('jobs-wrap'); if(!wrap) return; wrap.innerHTML='';
  const jobs=getJobs();
  // Stats
  const sr=document.getElementById('job-stats-row');
  if(sr){
    const cols=['applied','phone','technical','offer'];
    sr.innerHTML='';
    const labels={applied:'Applied',phone:'Phone',technical:'Technical',offer:'Offer'};
    const colors={applied:'var(--sub)',phone:'var(--blue)',technical:'var(--amber)',offer:'var(--green)'};
    cols.forEach(function(c){
      const cnt=jobs.filter(function(j){ return j.status===c; }).length;
      sr.innerHTML+='<div class="sc"><div class="sc-num" style="color:'+colors[c]+'">'+cnt+'</div><div class="sc-lbl">'+labels[c]+'</div></div>';
    });
  }
  const cols=['applied','phone','technical','offer'];
  const colLabels={applied:'📨 Applied',phone:'📞 Phone',technical:'💻 Technical',offer:'🎉 Offer'};
  cols.forEach(function(colKey){
    const colEl=document.createElement('div'); colEl.className='job-col';
    const colJobs=jobs.filter(function(j){ return j.status===colKey; });
    colEl.innerHTML='<div class="job-col-hdr"><span>'+colLabels[colKey]+'</span><span style="font-family:var(--mono);font-size:10px;color:var(--sub)">'+colJobs.length+'</span></div>';
    const body=document.createElement('div'); body.className='job-body';
    if(!colJobs.length){ body.innerHTML='<div style="color:var(--muted);font-size:12px;text-align:center;padding:14px 0">Empty</div>'; }
    colJobs.forEach(function(job){
      const card=document.createElement('div'); card.className='job-card';
      card.innerHTML='<div class="job-card-company">'+job.company+'</div>'
        +'<div class="job-card-role">'+job.role+'</div>'
        +'<div class="job-card-meta">'+job.source+(job.notes?' · '+job.notes.substring(0,30):'')+'</div>';
      const actions=document.createElement('div'); actions.className='job-card-actions';
      const nextCols={applied:'phone',phone:'technical',technical:'offer'};
      const nextLabels={applied:'→ Phone',phone:'→ Technical',technical:'→ Offer'};
      if(nextCols[colKey]){
        const moveBtn=document.createElement('button'); moveBtn.className='job-action-btn';
        moveBtn.textContent=nextLabels[colKey];
        moveBtn.addEventListener('click', function(){ moveJob(job.id,nextCols[colKey]); renderJobs(); });
        actions.appendChild(moveBtn);
      }
      if(colKey!=='applied'){
        const backBtn=document.createElement('button'); backBtn.className='job-action-btn';
        backBtn.textContent='← Back';
        const prevCols={phone:'applied',technical:'phone',offer:'technical'};
        backBtn.addEventListener('click', function(){ moveJob(job.id,prevCols[colKey]); renderJobs(); });
        actions.appendChild(backBtn);
      }
      const delBtn=document.createElement('button'); delBtn.className='job-action-btn job-del'; delBtn.textContent='✕ Remove';
      delBtn.addEventListener('click', function(){ deleteJob(job.id); renderJobs(); });
      actions.appendChild(delBtn);
      card.appendChild(actions); body.appendChild(card);
    });
    colEl.appendChild(body); wrap.appendChild(colEl);
  });
}

// ── VIEW 6: QBANK ─────────────────────────────────────────────────────────────
function bindQbank() {
  document.getElementById('qbank-search').addEventListener('input', function(){ qbSearch=this.value.toLowerCase(); renderQbank(); });
  document.querySelectorAll('.qb-chip[data-cat]').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.qb-chip[data-cat]').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active'); qbCat=btn.dataset.cat; renderQbank();
    });
  });
  document.querySelectorAll('.qb-chip[data-diff]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const wasActive=btn.classList.contains('active');
      document.querySelectorAll('.qb-chip[data-diff]').forEach(function(b){ b.classList.remove('active'); });
      if(wasActive){ qbDiff=''; } else { btn.classList.add('active'); qbDiff=btn.dataset.diff; }
      renderQbank();
    });
  });
}
function renderQbank() {
  const wrap=document.getElementById('qbank-wrap'); if(!wrap) return; wrap.innerHTML='';
  const filtered=QBANK.filter(function(q){
    if(qbCat!=='all'&&q.cat!==qbCat) return false;
    if(qbDiff&&q.diff!==qbDiff) return false;
    if(qbSearch&&!q.q.toLowerCase().includes(qbSearch)&&!q.a.toLowerCase().includes(qbSearch)) return false;
    return true;
  });
  const countEl=document.getElementById('qbank-count');
  if(countEl){ const done=filtered.filter(function(q){ return qDone(q.id); }).length; countEl.textContent=done+'/'+filtered.length+' answered'; }
  filtered.forEach(function(q){
    const card=document.createElement('div'); card.className='q-card'+(qDone(q.id)?' done-q':'');
    const diffClass={'easy':'q-diff-easy','med':'q-diff-med','hard':'q-diff-hard'}[q.diff]||'';
    const catLabels={k8s:'Kubernetes',gitops:'GitOps',iac:'IaC',security:'Security',cicd:'CI/CD',obs:'Observability',platform:'Platform'};
    card.innerHTML='<div class="q-card-top">'
      +'<div class="q-check'+(qDone(q.id)?' on':'')+'"></div>'
      +'<div class="q-question">'+q.q+'</div></div>'
      +'<div class="q-meta">'
        +'<span class="q-cat">'+catLabels[q.cat]+'</span>'
        +'<span class="q-cat '+diffClass+'">'+q.diff+'</span>'
      +'</div>'
      +'<div class="q-answer-wrap"><div class="q-answer"><div class="q-answer-inner">'+q.a+'</div></div></div>';
    card.addEventListener('click', function(){
      card.querySelector('.q-answer-wrap').classList.toggle('open');
    });
    card.querySelector('.q-check').addEventListener('click', function(e){
      e.stopPropagation(); toggleQ(q.id);
      card.querySelector('.q-check').classList.toggle('on',qDone(q.id));
      card.classList.toggle('done-q',qDone(q.id));
      const countEl=document.getElementById('qbank-count');
      if(countEl){ const done=filtered.filter(function(q){ return qDone(q.id); }).length; countEl.textContent=done+'/'+filtered.length+' answered'; }
    });
    wrap.appendChild(card);
  });
}

// ── VIEW 7: STATS ─────────────────────────────────────────────────────────────
function renderStats() {
  const content=document.getElementById('stats-content'); if(!content) return; content.innerHTML='';
  const {tot,don}=typeCounts(); const readiness=readinessScore();
  const xp=calcXP(); const {lvl,next,pct:xpPct,idx}=getLevel(xp); const low=lowConfTasks();
  const grid=document.createElement('div'); grid.className='stat-grid';

  const rCard=document.createElement('div'); rCard.className='stat-card';
  rCard.innerHTML='<div class="stat-card-title">Readiness Score</div>'
    +'<div style="font-size:46px;font-weight:800;font-family:var(--mono);background:linear-gradient(135deg,var(--green),var(--blue));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">'+readiness+'<span style="font-size:22px">%</span></div>'
    +'<div style="font-size:12px;color:var(--sub);margin-top:6px">Quizzes 30% · Projects 30% · Code 25% · Concepts 15%</div>';

  const xpCard=document.createElement('div'); xpCard.className='stat-card';
  xpCard.innerHTML='<div class="stat-card-title">XP & Level</div>'
    +'<div style="font-size:32px;font-weight:800;font-family:var(--mono);color:var(--amber)">'+xp+' <span style="font-size:16px">XP</span></div>'
    +'<div style="font-size:13px;font-weight:600;margin:6px 0 4px;color:'+lvl.color+'">'+lvl.title+'</div>'
    +'<div style="height:5px;background:var(--s3);border-radius:3px;overflow:hidden;margin-bottom:5px"><div style="height:100%;background:'+lvl.color+';width:'+xpPct+'%;border-radius:3px;transition:width .5s"></div></div>'
    +(next?'<div style="font-family:var(--mono);font-size:10px;color:var(--sub)">'+(next.min-xp)+' XP → '+next.title+'</div>':'<div style="font-family:var(--mono);font-size:10px;color:var(--green)">MAX LEVEL</div>');

  const tCard=document.createElement('div'); tCard.className='stat-card';
  tCard.innerHTML='<div class="stat-card-title">Task Types</div>';
  [{k:'concept',label:'concept',color:'#4fa8ff'},{k:'code',label:'code',color:'#00d9a0'},{k:'quiz',label:'quiz',color:'#ffc850'},{k:'project',label:'project',color:'#c084fc'}]
  .forEach(function(type){
    const t=tot[type.k]||0,d=don[type.k]||0,pct=t?Math.round(d/t*100):0;
    const row=document.createElement('div'); row.className='type-row';
    row.innerHTML='<span class="type-label" style="color:'+type.color+'">'+type.label+'</span>'
      +'<div class="type-bar-track"><div class="type-bar-fill" style="width:'+pct+'%;background:'+type.color+'"></div></div>'
      +'<span class="type-count">'+d+'/'+t+'</span>';
    tCard.appendChild(row);
  });

  const ppCard=document.createElement('div'); ppCard.className='stat-card';
  ppCard.innerHTML='<div class="stat-card-title">Phase Progress</div>';
  PHASES.forEach(function(ph,pi){
    const phTotal=ph.data.reduce(function(a,d,di){ return a+dayTotal(pi,di); },0);
    const phDone=ph.data.reduce(function(a,d,di){ return a+dayDone(pi,di); },0);
    const pct=phTotal?Math.round(phDone/phTotal*100):0;
    const row=document.createElement('div'); row.className='type-row';
    const shortName='P'+(pi+1);
    row.innerHTML='<span class="type-label" style="color:'+ph.color+';font-size:10px">'+shortName+'</span>'
      +'<div class="type-bar-track"><div class="type-bar-fill" style="width:'+pct+'%;background:'+ph.color+'"></div></div>'
      +'<span class="type-count">'+pct+'%</span>';
    ppCard.appendChild(row);
  });

  grid.appendChild(rCard); grid.appendChild(xpCard); grid.appendChild(tCard); grid.appendChild(ppCard);
  content.appendChild(grid);

  // Low confidence
  if(low.length){
    const lcCard=document.createElement('div'); lcCard.className='stat-card'; lcCard.style.gridColumn='1/-1';
    lcCard.innerHTML='<div class="stat-card-title">⚠ Low Confidence Tasks (★1–2) — Scheduled for Review</div>';
    low.slice(0,10).forEach(function(item){
      const div=document.createElement('div');
      div.style='font-size:12px;color:var(--sub);margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid var(--s3)';
      div.innerHTML='<span style="font-family:var(--mono);color:var(--red)">★'+item.conf+'</span> '+item.d.day+': '+item.task.t.substring(0,80);
      lcCard.appendChild(div);
    });
    content.appendChild(lcCard);
  }

  // Heatmap
  const hmCard=document.createElement('div'); hmCard.className='stat-card'; hmCard.style.gridColumn='1/-1';
  hmCard.innerHTML='<div class="stat-card-title" style="margin-bottom:10px">Activity Heatmap (last 84 days)</div>';
  const hmGrid=document.createElement('div'); hmGrid.className='heatmap-grid';
  const hist=S._history||{};
  ['S','M','T','W','T','F','S'].forEach(function(l){
    const lbl=document.createElement('div'); lbl.className='heat-day-lbl'; lbl.textContent=l; hmGrid.appendChild(lbl);
  });
  const startDate=new Date(); startDate.setDate(startDate.getDate()-83);
  for(let pad=0;pad<startDate.getDay();pad++){ hmGrid.appendChild(document.createElement('div')); }
  for(let i=0;i<84;i++){
    const d=new Date(startDate); d.setDate(startDate.getDate()+i);
    const count=hist[d.toDateString()]||0;
    const cell=document.createElement('div');
    cell.className='heat-cell'+(count>=15?' h4':count>=10?' h3':count>=5?' h2':count>0?' h1':'');
    cell.title=d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+': '+count+' tasks';
    hmGrid.appendChild(cell);
  }
  hmCard.appendChild(hmGrid); content.appendChild(hmCard);
}

// ── VIEW 8: GITHUB ────────────────────────────────────────────────────────────
function bindGithub() {
  const savedUser=getGHUser();
  if(savedUser){ document.getElementById('gh-username-input').value=savedUser; fetchGithub(savedUser); }
  document.getElementById('gh-fetch-btn').addEventListener('click', function(){
    const u=document.getElementById('gh-username-input').value.trim();
    if(u){ setGHUser(u); fetchGithub(u); }
  });
}
async function fetchGithub(username) {
  const container=document.getElementById('gh-card-content');
  container.innerHTML='<div class="ai-spinner" style="margin:20px auto"></div>';
  try {
    const [userRes,eventsRes]=await Promise.all([
      fetch('https://api.github.com/users/'+username),
      fetch('https://api.github.com/users/'+username+'/events/public?per_page=100')
    ]);
    const user=await userRes.json();
    const events=await eventsRes.json();
    if(user.message){ container.innerHTML='<div style="color:var(--red);font-size:13px">User not found: '+username+'</div>'; return; }
    // Build contribution map from events (last 90 days)
    const contribMap={};
    if(Array.isArray(events)){
      events.filter(function(e){ return e.type==='PushEvent'; }).forEach(function(e){
        const day=e.created_at.substring(0,10);
        contribMap[day]=(contribMap[day]||0)+1;
      });
    }
    const today=new Date().toISOString().substring(0,10);
    const pushedToday=!!contribMap[today];
    container.innerHTML='';
    const profile=document.createElement('div'); profile.className='gh-profile';
    profile.innerHTML='<img class="gh-avatar" src="'+user.avatar_url+'" alt=""/>'
      +'<div><div class="gh-name">'+user.name+'</div>'
      +'<div class="gh-handle">@'+user.login+' · '+user.public_repos+' repos · '+user.followers+' followers</div></div>'
      +'<div style="margin-left:auto;font-family:var(--mono);font-size:12px;padding:6px 12px;border-radius:var(--r8);'+(pushedToday?'color:var(--green);background:rgba(0,217,160,.08);border:1px solid rgba(0,217,160,.3)':'color:var(--red);background:rgba(255,95,95,.08);border:1px solid rgba(255,95,95,.3)')+'">'+( pushedToday?'✓ Pushed today':'⚠ No push today')+'</div>';
    container.appendChild(profile);
    // Contrib grid
    const gridLabel=document.createElement('div'); gridLabel.style='font-family:var(--mono);font-size:10px;color:var(--sub);margin-bottom:6px'; gridLabel.textContent='Push activity (last 90 days)';
    container.appendChild(gridLabel);
    const grid=document.createElement('div'); grid.className='gh-contrib-grid';
    for(let i=89;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=d.toISOString().substring(0,10);
      const cnt=contribMap[key]||0;
      const cell=document.createElement('div');
      cell.className='gh-cell'+(cnt>=5?' gc4':cnt>=3?' gc3':cnt>=1?' gc2':cnt>0?' gc1':'');
      cell.title=key+': '+cnt+' pushes';
      grid.appendChild(cell);
    }
    container.appendChild(grid);
    if(!pushedToday){
      const warn=document.createElement('div');
      warn.style='margin-top:12px;background:rgba(255,95,95,.06);border:1px solid rgba(255,95,95,.2);border-radius:var(--r8);padding:10px 13px;font-size:13px;color:var(--red)';
      warn.textContent='⚠ You haven\'t pushed to GitHub today. Even a small commit keeps the streak alive!';
      container.appendChild(warn);
    }
  } catch(e){ container.innerHTML='<div style="color:var(--red);font-size:13px">Error fetching GitHub data.</div>'; }
}

// ── VIEW 9: REPORT ────────────────────────────────────────────────────────────
function bindReport() {
  document.getElementById('report-prev').addEventListener('click', function(){ reportWeekOffset++; renderReport(); });
  document.getElementById('report-next').addEventListener('click', function(){ if(reportWeekOffset>0){ reportWeekOffset--; renderReport(); } });
  document.getElementById('report-export').addEventListener('click', exportReport);
}
function renderReport() {
  const wd=weekData(reportWeekOffset);
  const weekTasks=wd.reduce(function(a,d){ return a+d.count; },0);
  const activeDays=wd.filter(function(d){ return d.count>0&&!d.isFuture; }).length;
  const wLabel=reportWeekOffset===0?'This week':reportWeekOffset===1?'Last week':reportWeekOffset+' weeks ago';
  const g=function(id){ return document.getElementById(id); };
  if(g('report-week-label')) g('report-week-label').textContent=wLabel;
  if(g('report-next')) g('report-next').disabled=reportWeekOffset===0;
  if(g('rw-tasks')) g('rw-tasks').textContent=weekTasks;
  if(g('rw-days'))  g('rw-days').textContent=activeDays+'/7';
  if(g('rw-hrs'))   g('rw-hrs').textContent=studyHours()+'h';
  if(g('rw-ready')) g('rw-ready').textContent=readinessScore()+'%';
  const barsEl=g('report-day-bars');
  if(barsEl){
    barsEl.innerHTML='';
    const maxCount=Math.max(1,...wd.map(function(d){ return d.count; }));
    wd.forEach(function(day){
      const row=document.createElement('div'); row.className='day-bar-row';
      row.innerHTML='<span class="day-bar-name">'+day.name+'</span>'
        +'<div class="day-bar-track"><div class="day-bar-fill" style="width:'+Math.round(day.count/maxCount*100)+'%'+(day.isFuture?';background:var(--s3)':'')+'"></div></div>'
        +'<span class="day-bar-count">'+(day.isFuture?'—':day.count+' tasks')+'</span>';
      barsEl.appendChild(row);
    });
  }
  // ETA Band
  const eta=calcETA();
  const etaBand=g('eta-band');
  if(eta&&etaBand&&eta.etaBest&&eta.etaWorst){
    etaBand.style.display='block';
    const bc=g('eta-band-content');
    if(bc) bc.innerHTML='Best case: <strong style="color:var(--green)">'+eta.etaBest+'</strong> · Likely: <strong style="color:var(--amber)">'+eta.eta+'</strong> · Worst case: <strong style="color:var(--red)">'+eta.etaWorst+'</strong><br><span style="font-size:11px;font-family:var(--mono)">Based on '+eta.avgPerDay+' avg tasks/day over last 7 active days</span>';
  }
  updateStats();
}
function exportReport() {
  const done=cntDone(),total=cntTotal(),pct=total?Math.round(done/total*100):0;
  let text='90 Days of DevOps v2 — Weekly Report\n'+'='.repeat(42)+'\nGenerated: '+new Date().toLocaleDateString('en-IN')+'\n\n';
  text+='OVERALL: '+done+'/'+total+' tasks ('+pct+'%) | XP: '+calcXP()+' | Readiness: '+readinessScore()+'%\n';
  text+='Level: '+getLevel(calcXP()).lvl.title+'\n\n';
  text+='PHASE BREAKDOWN:\n';
  PHASES.forEach(function(ph,pi){
    const phTotal=ph.data.reduce(function(a,d,di){ return a+dayTotal(pi,di); },0);
    const phDone=ph.data.reduce(function(a,d,di){ return a+dayDone(pi,di); },0);
    text+=ph.title+': '+phDone+'/'+phTotal+'\n';
  });
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='devops90-v2-report.txt'; a.click();
  URL.revokeObjectURL(url);
}

// ── POMODORO ──────────────────────────────────────────────────────────────────
function bindPomodoro() {
  const MODES={focus:25*60,short:5*60,long:15*60};
  let mode='focus',timeLeft=MODES.focus,running=false,interval=null;
  const circ=2*Math.PI*70;
  const numEl=document.getElementById('pomo-num');
  const lblEl=document.getElementById('pomo-lbl');
  const progEl=document.getElementById('pomo-prog');
  const sesEl=document.getElementById('pomo-sessions');
  const playBtn=document.getElementById('pomo-play');
  const resetBtn=document.getElementById('pomo-reset');
  const modal=document.getElementById('pomo-modal');
  document.getElementById('pomo-nav-btn').addEventListener('click', function(){ modal.classList.add('open'); });
  document.getElementById('pomo-close').addEventListener('click', function(){ modal.classList.remove('open'); });
  modal.addEventListener('click', function(e){ if(e.target===modal) modal.classList.remove('open'); });
  document.querySelectorAll('.pomo-mode-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.pomo-mode-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active'); mode=btn.dataset.mode; timeLeft=MODES[mode];
      clearInterval(interval); running=false; playBtn.textContent='▶'; renderPomo();
    });
  });
  playBtn.addEventListener('click', function(){
    if(running){ clearInterval(interval); running=false; playBtn.textContent='▶'; }
    else {
      running=true; playBtn.textContent='⏸';
      interval=setInterval(function(){
        timeLeft--;
        if(timeLeft<=0){
          clearInterval(interval); running=false; playBtn.textContent='▶'; timeLeft=0;
          if(mode==='focus'){ if(!S._pomoSessions)S._pomoSessions=0; S._pomoSessions++; save(); }
          showToast(mode==='focus'?'🍅 Pomodoro complete! Time for a break.':'☕ Break over! Back to work.','rgba(0,217,160,.12)');
          if(Notification.permission==='granted') new Notification(mode==='focus'?'Pomodoro complete!':'Break over!');
        }
        renderPomo();
      },1000);
    }
  });
  resetBtn.addEventListener('click', function(){ clearInterval(interval); running=false; playBtn.textContent='▶'; timeLeft=MODES[mode]; renderPomo(); });
  function renderPomo(){
    const m=Math.floor(timeLeft/60),s=timeLeft%60;
    numEl.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
    lblEl.textContent=mode.toUpperCase();
    progEl.style.strokeDashoffset=circ*(1-timeLeft/MODES[mode]);
    const sess=S._pomoSessions||0;
    if(sesEl) sesEl.textContent='Sessions: '+sess+' · '+(sess*25/60).toFixed(1)+' hrs studied';
  }
  if('Notification' in window&&Notification.permission==='default') Notification.requestPermission();
  renderPomo();
}
