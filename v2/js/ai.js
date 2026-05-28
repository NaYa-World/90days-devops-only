// ─── AI BRIEF + SMART NEXT (Anthropic API) ───────────────────────────────────

async function generateAIBrief(pi, di) {
  const ph = PHASES[pi], d = ph.data[di];
  const tasks = d.tasks.map(function(t){ return '- ['+t.k+'] '+t.t; }).join('\n');
  const doneCount = dayDone(pi,di), totalCount = dayTotal(pi,di);
  const note = getNote(pi,di);

  const prompt = `You are a DevOps mentor helping an engineer study the 90 Days of DevOps curriculum.

Today's focus: ${d.day} — "${d.label}" (Phase: ${ph.title})
Progress: ${doneCount}/${totalCount} tasks complete
Tasks for today:
${tasks}
${note ? 'Student notes: '+note : ''}

Provide a concise, practical daily brief with exactly these sections (use these exact headings):

## 🎯 What You'll Learn Today
2-3 sentences explaining the core value of today's topics in plain English.

## ⚡ Key Concepts to Nail
3-4 bullet points with the most important concepts, each with a one-line explanation.

## 🛠 Hands-On Focus
The single most important practical exercise for today and why it matters.

## 🔗 How This Connects
One sentence connecting today's topic to the broader DevOps picture.

## ❓ Self-Check Question
One challenging question the student should be able to answer after completing today's tasks.

Keep it concise, actionable, and avoid generic advice. Be specific to the exact tools and concepts listed.`;

  const container = document.getElementById('ai-brief-content');
  if(!container) return;
  container.innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:var(--sub);font-size:13px"><div class="ai-spinner"></div>Generating your daily brief…</div>';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : 'Could not generate brief. Check your connection.';
    container.innerHTML = renderMarkdown(text);
  } catch(e) {
    container.innerHTML = '<div style="color:var(--red);font-size:13px">⚠ Could not connect to AI. Check network or try again.</div>';
  }
}

async function generateAIQuiz(pi, di) {
  const ph = PHASES[pi], d = ph.data[di];
  const tasks = d.tasks.map(function(t){ return t.t; }).join(', ');

  const prompt = `You are a DevOps interview coach. Generate a single challenging, scenario-based quiz question for someone who just studied: "${d.label}" covering: ${tasks}

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":0,"explanation":"..."}

Where answer is the 0-based index of the correct option. Make the question realistic and the distractors plausible.`;

  const container = document.getElementById('ai-quiz-content');
  if(!container) return;
  container.innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:var(--sub);font-size:13px"><div class="ai-spinner"></div>Generating quiz question…</div>';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    let text = data.content && data.content[0] ? data.content[0].text : '';
    text = text.replace(/```json|```/g,'').trim();
    const quiz = JSON.parse(text);
    renderAIQuiz(quiz, container);
  } catch(e) {
    container.innerHTML = '<div style="color:var(--red);font-size:13px">⚠ Could not generate quiz question. Try again.</div>';
  }
}

function renderAIQuiz(quiz, container) {
  let answered = false;
  container.innerHTML = '';

  const qEl = document.createElement('div');
  qEl.style = 'font-size:14px;font-weight:600;margin-bottom:14px;line-height:1.5;color:var(--text)';
  qEl.textContent = quiz.question;
  container.appendChild(qEl);

  const optsEl = document.createElement('div');
  optsEl.style = 'display:flex;flex-direction:column;gap:7px;margin-bottom:14px';
  quiz.options.forEach(function(opt, i){
    const btn = document.createElement('button');
    btn.style = 'text-align:left;background:var(--s3);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:var(--r8);cursor:pointer;font-size:13px;transition:all .2s;font-family:var(--body)';
    btn.textContent = opt;
    btn.addEventListener('mouseenter', function(){ if(!answered) btn.style.borderColor='var(--blue)'; });
    btn.addEventListener('mouseleave', function(){ if(!answered) btn.style.borderColor='var(--border)'; });
    btn.addEventListener('click', function(){
      if(answered) return;
      answered = true;
      optsEl.querySelectorAll('button').forEach(function(b,j){
        if(j === quiz.answer) b.style = 'text-align:left;background:rgba(0,217,160,.12);border:1px solid var(--green);color:var(--green);padding:10px 14px;border-radius:var(--r8);font-size:13px;font-family:var(--body)';
        else if(j === i && i !== quiz.answer) b.style = 'text-align:left;background:rgba(255,95,95,.08);border:1px solid var(--red);color:var(--red);padding:10px 14px;border-radius:var(--r8);font-size:13px;font-family:var(--body)';
        else b.style = 'text-align:left;background:var(--s3);border:1px solid var(--border);color:var(--muted);padding:10px 14px;border-radius:var(--r8);font-size:13px;font-family:var(--body)';
      });
      const expEl = document.createElement('div');
      expEl.style = 'background:var(--s2);border:1px solid var(--border);border-radius:var(--r8);padding:12px 14px;font-size:13px;color:var(--sub);line-height:1.6;margin-top:10px';
      expEl.innerHTML = '<span style="color:var(--text);font-weight:600">Explanation: </span>'+quiz.explanation;
      container.appendChild(expEl);
    });
    optsEl.appendChild(btn);
  });
  container.appendChild(optsEl);
}

// renderMarkdown is defined in app.js
