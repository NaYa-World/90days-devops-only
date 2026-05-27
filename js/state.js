// ─── STATE ENGINE v2 ──────────────────────────────────────────────────────────
const SK = 'devops90_v2';
let S = {};

function save() { try { localStorage.setItem(SK, JSON.stringify(S)); } catch(_){} }
function load() { try { const r = localStorage.getItem(SK); if(r) S = JSON.parse(r); } catch(_){} }

function tid(pi,di,ti) { return 'p'+pi+'d'+di+'t'+ti; }

function allDays() {
  const out = [];
  PHASES.forEach(function(ph,pi){ ph.data.forEach(function(d,di){ out.push({ph,pi,d,di}); }); });
  return out;
}
function allIds() {
  const out = [];
  PHASES.forEach(function(ph,pi){ ph.data.forEach(function(d,di){ d.tasks.forEach(function(_,ti){ out.push(tid(pi,di,ti)); }); }); });
  return out;
}

function cntDone()       { return allIds().filter(function(id){ return !!S[id]; }).length; }
function cntTotal()      { return allIds().length; }
function dayDone(pi,di)  { return PHASES[pi].data[di].tasks.filter(function(_,ti){ return !!S[tid(pi,di,ti)]; }).length; }
function dayTotal(pi,di) { return PHASES[pi].data[di].tasks.length; }
function dayPct(pi,di)   { const t=dayTotal(pi,di); return t?Math.round(dayDone(pi,di)/t*100):0; }
function dayStatus(pi,di) {
  const d=dayDone(pi,di),t=dayTotal(pi,di);
  if(d===0) return 'backlog';
  if(d===t) return 'done';
  if(d/t>=0.5) return 'review';
  return 'inprogress';
}

function noteKey(pi,di) { return 'note_'+pi+'_'+di; }
function getNote(pi,di) { return S[noteKey(pi,di)]||''; }
function setNote(pi,di,val) { S[noteKey(pi,di)]=val; save(); }
function hasNote(pi,di) { return !!(S[noteKey(pi,di)]&&S[noteKey(pi,di)].trim()); }

function confKey(pi,di,ti) { return 'conf_'+pi+'_'+di+'_'+ti; }
function getConf(pi,di,ti) { return S[confKey(pi,di,ti)]||0; }
function setConf(pi,di,ti,val) { S[confKey(pi,di,ti)]=val; save(); }
function dayAvgConf(pi,di) {
  const tasks=PHASES[pi].data[di].tasks;
  const rated=tasks.map(function(_,ti){ return getConf(pi,di,ti); }).filter(function(v){ return v>0; });
  if(!rated.length) return 0;
  return rated.reduce(function(a,b){ return a+b; },0)/rated.length;
}
function lowConfTasks() {
  const out=[];
  PHASES.forEach(function(ph,pi){
    ph.data.forEach(function(d,di){
      d.tasks.forEach(function(task,ti){
        const c=getConf(pi,di,ti);
        if(c>0&&c<=2) out.push({ph,pi,d,di,task,ti,conf:c});
      });
    });
  });
  return out;
}

function typeCounts() {
  const tot={concept:0,code:0,quiz:0,project:0};
  const don={concept:0,code:0,quiz:0,project:0};
  PHASES.forEach(function(ph,pi){
    ph.data.forEach(function(d,di){
      d.tasks.forEach(function(task,ti){
        tot[task.k]=(tot[task.k]||0)+1;
        if(S[tid(pi,di,ti)]) don[task.k]=(don[task.k]||0)+1;
      });
    });
  });
  return {tot,don};
}

function studyHours() { return ((S._pomoSessions||0)*25/60).toFixed(1); }

function calcETA() {
  const done=cntDone(),total=cntTotal(),left=total-done;
  const history=S._history||{};
  const days=Object.keys(history).filter(function(k){ return history[k]>0; });
  if(days.length<2||done===0) return null;
  const recent=days.slice(-7);
  let tasksDone=0;
  recent.forEach(function(k){ tasksDone+=(history[k]||0); });
  const avgPerDay=tasksDone/recent.length;
  if(avgPerDay<=0) return null;
  const daysLeft=Math.ceil(left/avgPerDay);
  const eta=new Date(); eta.setDate(eta.getDate()+daysLeft);
  // ETA band: best week vs worst week
  const allWeeklyAvgs = [];
  for(let i=0;i<days.length-6;i+=7){
    const slice=days.slice(i,i+7);
    const sum=slice.reduce(function(a,k){ return a+(history[k]||0); },0);
    if(sum>0) allWeeklyAvgs.push(sum/slice.length);
  }
  let etaBest=null,etaWorst=null;
  if(allWeeklyAvgs.length>=2){
    const best=Math.max(...allWeeklyAvgs), worst=Math.min(...allWeeklyAvgs);
    const dBest=new Date(); dBest.setDate(dBest.getDate()+Math.ceil(left/best));
    const dWorst=new Date(); dWorst.setDate(dWorst.getDate()+Math.ceil(left/worst));
    etaBest=dBest.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
    etaWorst=dWorst.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  }
  return {daysLeft,eta:eta.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),avgPerDay:avgPerDay.toFixed(1),etaBest,etaWorst};
}

function readinessScore() {
  const {tot,don}=typeCounts();
  const qP=tot.quiz?don.quiz/tot.quiz:0;
  const prP=tot.project?don.project/tot.project:0;
  const cP=tot.code?don.code/tot.code:0;
  const coP=tot.concept?don.concept/tot.concept:0;
  const lowConf=lowConfTasks().length;
  const confPenalty=Math.min(lowConf*0.5,10);
  return Math.max(0,Math.round((qP*.30+prP*.30+cP*.25+coP*.15)*100-confPenalty));
}

function recordToday(tasksCount) {
  const today=new Date().toDateString();
  if(!S._history) S._history={};
  S._history[today]=tasksCount;
  if(S._lastDay!==today){
    const yesterday=new Date(Date.now()-86400000).toDateString();
    const hadFreeze = S._streakFreezeUsedOn === yesterday;
    if(S._lastDay===yesterday || hadFreeze){
      S._streak=(S._streak||0)+1;
    } else if(S._lastDay) {
      S._streak=1;
    } else {
      S._streak=1;
    }
    S._lastDay=today;
  }
  save();
}

function weekData(offsetWeeks) {
  offsetWeeks=offsetWeeks||0;
  const now=new Date();
  const startOfWeek=new Date(now);
  startOfWeek.setDate(now.getDate()-now.getDay()-offsetWeeks*7);
  startOfWeek.setHours(0,0,0,0);
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hist=S._history||{};
  return days.map(function(name,i){
    const d=new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i);
    const key=d.toDateString();
    return {name,date:key,count:hist[key]||0,isFuture:d>now};
  });
}

// ── XP / LEVELLING ────────────────────────────────────────────────────────────
const XP_MAP = {concept:10, code:25, quiz:20, project:50};
const LEVELS = [
  {min:0,    title:'Apprentice',     color:'#7d8fa8'},
  {min:200,  title:'Junior DevOps',  color:'#4fa8ff'},
  {min:600,  title:'DevOps Engineer',color:'#00d9a0'},
  {min:1200, title:'Senior DevOps',  color:'#ffc850'},
  {min:2000, title:'Platform Eng.',  color:'#c084fc'},
  {min:3000, title:'SRE',            color:'#f97316'},
  {min:4500, title:'Staff Engineer', color:'#ff5f5f'},
  {min:6000, title:'Principal',      color:'#38bdf8'},
];
function calcXP() {
  let xp=0;
  PHASES.forEach(function(ph,pi){
    ph.data.forEach(function(d,di){
      d.tasks.forEach(function(task,ti){
        if(S[tid(pi,di,ti)]) xp += (XP_MAP[task.k]||10);
      });
    });
  });
  return xp;
}
function getLevel(xp) {
  let lvl = LEVELS[0];
  for(let i=LEVELS.length-1;i>=0;i--){ if(xp>=LEVELS[i].min){ lvl=LEVELS[i]; break; } }
  const idx = LEVELS.indexOf(lvl);
  const next = LEVELS[idx+1] || null;
  const pct = next ? Math.round((xp-lvl.min)/(next.min-lvl.min)*100) : 100;
  return {lvl, next, pct, idx};
}

// ── SPACED REPETITION ─────────────────────────────────────────────────────────
const SR_INTERVALS = [3,7,14,30]; // days
function srKey(pi,di,ti) { return 'sr_'+pi+'_'+di+'_'+ti; }
function getSRData(pi,di,ti) { return S[srKey(pi,di,ti)] || null; }
function scheduleSR(pi,di,ti,conf) {
  const now = Date.now();
  const interval = SR_INTERVALS[Math.min(conf-1, SR_INTERVALS.length-1)] || 3;
  const nextReview = now + interval*24*60*60*1000;
  S[srKey(pi,di,ti)] = {nextReview, interval, conf};
  save();
}
function getDueReviews() {
  const now = Date.now();
  const out = [];
  PHASES.forEach(function(ph,pi){
    ph.data.forEach(function(d,di){
      d.tasks.forEach(function(task,ti){
        const sr = getSRData(pi,di,ti);
        if(sr && sr.nextReview <= now) out.push({ph,pi,d,di,task,ti,sr});
      });
    });
  });
  return out;
}
function markSRReviewed(pi,di,ti,newConf) {
  scheduleSR(pi,di,ti,newConf);
}

// ── STREAK FREEZE ─────────────────────────────────────────────────────────────
function getFreezesAvail() {
  const used = S._freezeUsedWeek || '';
  const thisWeek = getWeekKey();
  if(used === thisWeek) return 0;
  return 1;
}
function useFreeze() {
  const yesterday = new Date(Date.now()-86400000).toDateString();
  S._streakFreezeUsedOn = yesterday;
  S._freezeUsedWeek = getWeekKey();
  save();
}
function getWeekKey() {
  const now = new Date();
  const d = new Date(now); d.setDate(now.getDate()-now.getDay());
  return d.toDateString();
}

// ── JOB TRACKER ───────────────────────────────────────────────────────────────
function getJobs()     { return S._jobs||[]; }
function addJob(job)   { if(!S._jobs)S._jobs=[]; S._jobs.unshift({...job,id:Date.now(),status:'applied',createdAt:new Date().toDateString()}); save(); }
function deleteJob(id) { S._jobs=(S._jobs||[]).filter(function(j){ return j.id!==id; }); save(); }
function moveJob(id,st){ const j=(S._jobs||[]).find(function(j){ return j.id===id; }); if(j){j.status=st;j.updatedAt=new Date().toDateString();} save(); }

// ── GITHUB USERNAME ───────────────────────────────────────────────────────────
function getGHUser() { return S._ghUser||''; }
function setGHUser(u){ S._ghUser=u; save(); }

// ── QBANK PROGRESS ────────────────────────────────────────────────────────────
function qDone(qId)   { return !!(S._qdone&&S._qdone[qId]); }
function toggleQ(qId) { if(!S._qdone)S._qdone={}; S._qdone[qId]=!S._qdone[qId]; save(); }

// ── SMART NEXT TASK ───────────────────────────────────────────────────────────
function getSmartNext() {
  // Find weakest phase (lowest % done)
  let weakestPi = 0, weakestPct = 100;
  PHASES.forEach(function(ph,pi){
    const tot=ph.data.reduce(function(a,d,di){ return a+dayTotal(pi,di); },0);
    const don=ph.data.reduce(function(a,d,di){ return a+dayDone(pi,di); },0);
    const pct=tot?don/tot*100:100;
    if(pct<weakestPct){ weakestPct=pct; weakestPi=pi; }
  });
  // First incomplete day in weakest phase
  let result = null;
  PHASES[weakestPi].data.forEach(function(d,di){
    if(result) return;
    if(dayDone(weakestPi,di)<dayTotal(weakestPi,di)) result={pi:weakestPi,di,d,ph:PHASES[weakestPi]};
  });
  // Fallback: any first incomplete day
  if(!result){
    PHASES.forEach(function(ph,pi){
      if(result) return;
      ph.data.forEach(function(d,di){
        if(result) return;
        if(dayDone(pi,di)<dayTotal(pi,di)) result={pi,di,d,ph};
      });
    });
  }
  return result;
}

// ── PHASE COMPLETION CHECK ────────────────────────────────────────────────────
function checkPhaseJustCompleted(pi) {
  const ph=PHASES[pi];
  const tot=ph.data.reduce(function(a,d,di){ return a+dayTotal(pi,di); },0);
  const don=ph.data.reduce(function(a,d,di){ return a+dayDone(pi,di); },0);
  const key='_phaseComp'+pi;
  if(don===tot && tot>0 && !S[key]){ S[key]=true; save(); return true; }
  return false;
}
