// ═══════════════════════════════════════════════════════════════
// V3 ADDITIONS — Labs, Certs, Lab Timer, Weekly Goals, PWA, SR Notifications
// This file is appended after app.js
// ═══════════════════════════════════════════════════════════════

// ── SERVICE WORKER REGISTRATION ───────────────────────────────────────────────
function registerSW() {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      console.log('SW registered');
      scheduleSRNotification(reg);
    }).catch(function(){});
  }
}

function scheduleSRNotification(reg) {
  if(!('Notification' in window)) return;
  Notification.requestPermission().then(function(perm){
    if(perm !== 'granted') return;
    // Check daily at load time - if reviews are due, show a notification
    const due = getDueReviews();
    if(due.length > 0) {
      reg.showNotification('🔁 DevOps Reviews Due', {
        body: due.length + ' spaced repetition task'+(due.length>1?'s are':' is')+' due today. Keep the knowledge fresh!',
        tag: 'devops-review',
        requireInteraction: false
      });
    }
  });
}

// ── VIEW: LABS ─────────────────────────────────────────────────────────────────
function renderLabs() {
  const content = document.getElementById('labs-content');
  if(!content) return;
  content.innerHTML = '';

  // Lab selector
  const labKeys = Object.keys(LABS);
  const sel = document.createElement('div');
  sel.style = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px';
  labKeys.forEach(function(dk){
    const lab = LABS[dk];
    const done = labDayDone(dk), total = lab.exercises.length;
    const btn = document.createElement('button');
    btn.className = 'lab-day-btn' + (done===total&&total>0?' lab-day-done':'');
    btn.style = 'background:var(--s1);border:1px solid '+(done===total&&total>0?'var(--green)':'var(--border)')+';color:'+(done===total&&total>0?'var(--green)':'var(--sub)')+';font-family:var(--mono);font-size:11px;padding:5px 11px;border-radius:var(--r8);cursor:pointer;transition:all .2s';
    btn.textContent = lab.day + (done>0?' ('+done+'/'+total+')':'');
    btn.dataset.dk = dk;
    btn.addEventListener('click', function(){
      document.querySelectorAll('[data-dk]').forEach(function(b){ b.style.background='var(--s1)'; });
      btn.style.background = 'var(--s2)';
      renderLabExercises(dk);
    });
    sel.appendChild(btn);
  });
  content.appendChild(sel);

  // Lab exercises area
  const labArea = document.createElement('div');
  labArea.id = 'lab-exercises-area';
  content.appendChild(labArea);

  // Render first lab by default
  if(labKeys.length) renderLabExercises(labKeys[0]);
}

function renderLabExercises(dk) {
  const area = document.getElementById('lab-exercises-area');
  if(!area) return;
  area.innerHTML = '';
  const lab = LABS[dk];
  if(!lab) return;

  // Header
  const hdr = document.createElement('div');
  hdr.style = 'background:var(--s1);border:1px solid var(--border);border-radius:var(--r12);padding:16px 18px;margin-bottom:12px';
  const done = labDayDone(dk), total = lab.exercises.length;
  const pct = total ? Math.round(done/total*100) : 0;
  hdr.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<div><div style="font-family:var(--mono);font-size:11px;color:var(--green);margin-bottom:3px">'+lab.day+' · '+lab.type.toUpperCase()+' LAB</div>'
    +'<div style="font-size:16px;font-weight:700">'+lab.title+'</div></div>'
    +'<div style="font-family:var(--mono);font-size:13px;color:'+(done===total&&total>0?'var(--green)':'var(--sub)')+'">'+done+'/'+total+' done</div>'
    +'</div>'
    +'<div style="font-size:13px;color:var(--sub);margin-bottom:10px">'+lab.intro+'</div>'
    +'<div style="height:4px;background:var(--s3);border-radius:2px"><div style="height:100%;background:var(--green);border-radius:2px;width:'+pct+'%;transition:width .4s"></div></div>';

  // Docker/K8s playground links
  if(lab.type==='docker'||lab.type==='k8s') {
    const links = document.createElement('div');
    links.style = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap';
    if(lab.killercoda) {
      links.innerHTML += '<a href="'+lab.killercoda+'" target="_blank" style="display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:11px;color:var(--amber);text-decoration:none;padding:5px 11px;border:1px solid rgba(255,200,80,.3);border-radius:var(--r8);background:rgba(255,200,80,.06)">🎮 Open KillerCoda Lab →</a>';
    }
    if(lab.playdocker) {
      links.innerHTML += '<a href="'+lab.playdocker+'" target="_blank" style="display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:11px;color:var(--blue);text-decoration:none;padding:5px 11px;border:1px solid rgba(79,168,255,.3);border-radius:var(--r8);background:rgba(79,168,255,.06)">🐳 Play With Docker →</a>';
    }
    hdr.appendChild(links);
  }
  area.appendChild(hdr);

  // Terminal (for terminal-type labs)
  if(lab.type==='terminal') {
    area.appendChild(buildTerminal(dk, lab));
  }

  // Exercise list
  lab.exercises.forEach(function(ex, idx){
    area.appendChild(buildExerciseCard(dk, ex, idx, lab.type));
  });
}

// ── SIMULATED TERMINAL ─────────────────────────────────────────────────────────
function buildTerminal(dk, lab) {
  const wrap = document.createElement('div');
  wrap.className = 'terminal-wrap';
  wrap.style = 'background:#0d1117;border:1px solid #222d42;border-radius:var(--r12);overflow:hidden;margin-bottom:12px;font-family:var(--mono)';

  // Title bar
  wrap.innerHTML = '<div style="background:#1c2436;padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #222d42">'
    +'<span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block"></span>'
    +'<span style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;display:inline-block"></span>'
    +'<span style="width:10px;height:10px;border-radius:50%;background:#28c840;display:inline-block"></span>'
    +'<span style="font-size:11px;color:#7d8fa8;margin-left:8px">gk@devops-lab: ~</span>'
    +'<span style="margin-left:auto;font-size:10px;color:#4a5568">simulated terminal</span>'
    +'</div>';

  const output = document.createElement('div');
  output.id = 'terminal-output-'+dk;
  output.style = 'padding:12px 14px;min-height:120px;max-height:280px;overflow-y:auto;font-size:12px;line-height:1.8;color:#e6edf3';
  output.innerHTML = '<span style="color:#00d9a0">gk@devops-lab</span><span style="color:#7d8fa8">:~$</span> <span style="color:#7d8fa8">_  // Type a command below</span>\n';

  const inputRow = document.createElement('div');
  inputRow.style = 'display:flex;align-items:center;padding:8px 14px;border-top:1px solid #222d42;background:#0d1117';
  inputRow.innerHTML = '<span style="color:#00d9a0;font-size:12px;margin-right:8px;white-space:nowrap">gk@devops-lab:~$</span>';
  const inp = document.createElement('input');
  inp.type='text'; inp.id='terminal-input-'+dk;
  inp.style='flex:1;background:none;border:none;outline:none;font-family:var(--mono);font-size:12px;color:#e6edf3;caret-color:#00d9a0';
  inp.placeholder='type command and press Enter…';
  inputRow.appendChild(inp);

  const runBtn = document.createElement('button');
  runBtn.style='background:rgba(0,217,160,.1);border:1px solid rgba(0,217,160,.3);color:#00d9a0;font-family:var(--mono);font-size:10px;padding:4px 10px;border-radius:4px;cursor:pointer;margin-left:8px';
  runBtn.textContent='Run ↵';
  inputRow.appendChild(runBtn);

  wrap.appendChild(output);
  wrap.appendChild(inputRow);

  // Command history
  let history = [], histIdx = -1;

  function executeCommand(cmd) {
    if(!cmd.trim()) return;
    history.unshift(cmd); histIdx = -1;
    const result = simulateCommand(cmd, dk);
    appendToTerminal(output, cmd, result.output, result.isError);
    // Auto-check exercises
    lab.exercises.forEach(function(ex){
      if(!isLabDone(dk, ex.id)) {
        const passed = ex.check(result.output, cmd);
        if(passed) {
          markLabDone(dk, ex.id);
          appendSuccess(output, ex.ok);
          showToast('✓ Exercise passed! +'+ex.xp+' XP', 'rgba(0,217,160,.12)');
          updateStats();
          // Re-render exercise list to show completion
          setTimeout(function(){ renderLabExercises(dk); }, 800);
        }
      }
    });
    output.scrollTop = output.scrollHeight;
    inp.value = '';
  }

  inp.addEventListener('keydown', function(e){
    if(e.key==='Enter'){ executeCommand(inp.value); }
    if(e.key==='ArrowUp'){ if(histIdx<history.length-1){ histIdx++; inp.value=history[histIdx]; } }
    if(e.key==='ArrowDown'){ if(histIdx>0){ histIdx--; inp.value=history[histIdx]; } else{ histIdx=-1; inp.value=''; } }
  });
  runBtn.addEventListener('click', function(){ executeCommand(inp.value); });

  return wrap;
}

function appendToTerminal(output, cmd, result, isError) {
  const line = document.createElement('div');
  line.innerHTML = '<span style="color:#00d9a0">gk@devops-lab</span><span style="color:#7d8fa8">:~$</span> <span style="color:#e6edf3">'+escHtml(cmd)+'</span>';
  output.appendChild(line);
  if(result) {
    const res = document.createElement('div');
    res.style.color = isError ? '#ff5f5f' : '#a8b8cc';
    res.style.whiteSpace = 'pre-wrap';
    res.textContent = result;
    output.appendChild(res);
  }
}

function appendSuccess(output, msg) {
  const s = document.createElement('div');
  s.style = 'color:#00d9a0;background:rgba(0,217,160,.07);padding:4px 8px;border-radius:4px;margin:4px 0;font-size:11px';
  s.textContent = msg;
  output.appendChild(s);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── COMMAND SIMULATOR ─────────────────────────────────────────────────────────
// Simulates realistic output for common Linux commands
function simulateCommand(cmd, dk) {
  const c = cmd.trim();
  const parts = c.split(/\s+/);
  const base = parts[0];

  // pwd
  if(base==='pwd') return {output:'/home/gk', isError:false};
  // ls
  if(base==='ls') {
    if(c.includes('/etc')) return {output:'total 1.2M\ndrwxr-xr-x 1 root root 4096 Jan 1 00:00 .\ndrwxr-xr-x 1 root root 4096 Jan 1 00:00 ..\n-rw-r--r-- 1 root root 2.2K Jan 1 00:00 passwd\n-rw-r--r-- 1 root root 1.5K Jan 1 00:00 hosts\n-rw-r--r-- 1 root root 400  Jan 1 00:00 hostname\n-rw-r----- 1 root shadow 1.2K Jan 1 00:00 shadow', isError:false};
    return {output:'total 24\ndrwxr-xr-x 1 gk gk 4096 Jan 1 00:00 .\ndrwxr-xr-x 1 root root 4096 Jan 1 00:00 ..\n-rw-r--r-- 1 gk gk   33 Jan 1 00:00 notes.txt\ndrwxr-xr-x 1 gk gk 4096 Jan 1 00:00 devops-lab', isError:false};
  }
  // mkdir
  if(base==='mkdir') return {output:'', isError:false};
  // touch
  if(base==='touch') return {output:'', isError:false};
  // echo
  if(base==='echo') {
    const match = c.match(/echo\s+"?([^">]+)"?\s*(?:>.*)?$/);
    if(c.includes('>')) return {output:'', isError:false};
    return {output: match ? match[1].replace(/"/g,'') : '', isError:false};
  }
  // cat
  if(base==='cat') {
    if(c.includes('/etc/passwd')) return {output:'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\ngk:x:1000:1000:GK DevOps:/home/gk:/bin/bash', isError:false};
    if(c.includes('notes.txt')) return {output:'DevOps is culture', isError:false};
    return {output:'cat: file not found', isError:true};
  }
  // id
  if(base==='id') return {output:'uid=1000(gk) gid=1000(gk) groups=1000(gk),4(adm),24(cdrom),27(sudo),46(plugdev)', isError:false};
  // chmod
  if(base==='chmod') return {output:'', isError:false};
  // find
  if(base==='find' && c.includes('-user root')) return {output:'/etc/passwd\n/etc/shadow\n/etc/hosts\n/etc/hostname\n/etc/resolv.conf', isError:false};
  if(base==='find') return {output:'/home/gk/notes.txt\n/home/gk/devops-lab', isError:false};
  // grep
  if(base==='grep') {
    if(c.includes('/etc/passwd') && c.includes('root')) return {output:'root:x:0:0:root:/root:/bin/bash\noperator:x:11:0:operator:/root:/sbin/nologin', isError:false};
    if(c.includes('-c') && c.includes('bash')) return {output:'2', isError:false};
    if(c.includes('bash')) return {output:'/bin/bash\n/usr/bin/bash', isError:false};
    return {output:'', isError:false};
  }
  // awk
  if(base==='awk') {
    if(c.includes("'{print $1}'") || c.includes('print $1')) return {output:'root\ndaemon\nbin\ngk', isError:false};
    if(c.includes('NR>=3') || c.includes('NR>=')) return {output:'bin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nsync:x:4:65534:sync:/bin:/bin/sync', isError:false};
    return {output:'root\ndaemon\nbin\ngk', isError:false};
  }
  // sed
  if(base==='sed') return {output:'root:x:0:0:root:/root:/bin/sh\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\ngk:x:1000:1000:GK DevOps:/home/gk:/bin/sh', isError:false};
  // ps
  if(base==='ps') return {output:'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  18508  2844 ?        Ss   00:00   0:01 /sbin/init\nroot       100  0.0  0.0  14432  1524 ?        Ss   00:00   0:00 sshd\ngk        1001  0.1  0.2  23456  4096 pts/0    Ss   00:00   0:00 bash', isError:false};
  // df
  if(base==='df') return {output:'Filesystem      Size  Used Avail Use% Mounted on\noverlay          50G  8.2G   39G  18% /\ntmpfs            64M     0   64M   0% /dev\n/dev/sda1        50G  8.2G   39G  18% /', isError:false};
  // free
  if(base==='free') return {output:'              total        used        free      shared  buff/cache   available\nMem:           3906        1234        1456         128        1215        2340\nSwap:          2048           0        2048', isError:false};
  // pgrep
  if(base==='pgrep') return {output:'1001 bash\n1042 bash', isError:false};
  // ip
  if(base==='ip' && c.includes('addr')) return {output:'1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0', isError:false};
  if(base==='ip' && c.includes('route')) return {output:'default via 172.17.0.1 dev eth0\n172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.2', isError:false};
  // ss / netstat
  if(base==='ss'||base==='netstat') return {output:'State  Recv-Q Send-Q Local Address:Port  Peer Address:Port\nLISTEN 0      128    0.0.0.0:22         0.0.0.0:*\nLISTEN 0      128    0.0.0.0:80         0.0.0.0:*\nLISTEN 0      5      127.0.0.1:5432    0.0.0.0:*', isError:false};
  // ping
  if(base==='ping') return {output:'PING google.com (142.250.182.46) 56(84) bytes of data.\n64 bytes from 142.250.182.46: icmp_seq=1 ttl=116 time=12.3 ms\n64 bytes from 142.250.182.46: icmp_seq=2 ttl=116 time=11.8 ms\n64 bytes from 142.250.182.46: icmp_seq=3 ttl=116 time=12.1 ms\n--- google.com ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss', isError:false};
  // nslookup / dig
  if(base==='nslookup'||base==='dig') return {output:'Server: 8.8.8.8\nAddress: 8.8.8.8#53\nNon-authoritative answer:\nName: kubernetes.io\nAddress: 147.75.40.148', isError:false};
  // git
  if(base==='git') {
    if(c.includes('init')) return {output:'Initialized empty Git repository in /home/gk/myapp/.git/', isError:false};
    if(c.includes('config')) return {output:'', isError:false};
    if(c.includes('add')) return {output:'', isError:false};
    if(c.includes('commit')) return {output:'[main (root-commit) a1b2c3d] initial commit\n 1 file changed, 1 insertion(+)\n create mode 100644 README.md', isError:false};
    if(c.includes('log')) return {output:'a1b2c3d initial commit', isError:false};
    if(c.includes('status')) return {output:'On branch main\nnothing to commit, working tree clean', isError:false};
    return {output:'usage: git [command]', isError:false};
  }
  // docker
  if(base==='docker') {
    if(c.includes('pull')) return {output:'Using default tag: latest\nlatest: Pulling from library/nginx\nPull complete\nStatus: Downloaded newer image for nginx:alpine', isError:false};
    if(c.includes('run')) return {output:'a3f2c1d4e5b6c7d8e9f0a1b2c3d4e5f6', isError:false};
    if(c.includes('ps')) return {output:'CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS        PORTS                  NAMES\na3f2c1d4e5b6   nginx:alpine   "/docker-entrypoint…"   2 seconds ago  Up 2 seconds  0.0.0.0:8080->80/tcp   my-nginx', isError:false};
    if(c.includes('images')) return {output:'REPOSITORY   TAG       IMAGE ID       CREATED       SIZE\nnginx        alpine    abc123def456   2 weeks ago   23.4MB\nmyapp        v1        def456abc123   1 minute ago  142MB', isError:false};
    if(c.includes('stop')) return {output:'my-nginx', isError:false};
    if(c.includes('rm')) return {output:'my-nginx', isError:false};
    if(c.includes('logs')) return {output:'172.17.0.1 - - [01/Jan/2024:00:00:01 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/7.68.0"', isError:false};
    if(c.includes('history')) return {output:'IMAGE          CREATED BY                                      SIZE\nabc123def456   CMD ["nginx" "-g" "daemon off;"]                 0B\n               EXPOSE map[80/tcp:{}]                            0B\n               COPY file:xxx in /                              23.4MB', isError:false};
    if(c.includes('build')) return {output:'[+] Building 12.3s\n => [1/5] FROM node:18-alpine\n => [2/5] WORKDIR /app\n => [3/5] COPY package*.json ./\n => [4/5] RUN npm install\n => [5/5] COPY . .\nSuccessfully built def456abc123\nSuccessfully tagged myapp:v1', isError:false};
    return {output:'docker: command options', isError:false};
  }
  // docker compose
  if(c.startsWith('docker compose')||c.startsWith('docker-compose')) {
    if(c.includes('up')) return {output:'[+] Running 2/2\n ✔ Container devops-lab-web-1    Started\n ✔ Container devops-lab-cache-1  Started', isError:false};
    if(c.includes('ps')) return {output:'NAME                    IMAGE          STATUS         PORTS\ndevops-lab-web-1        nginx:alpine   Up 2 seconds   0.0.0.0:8080->80/tcp\ndevops-lab-cache-1      redis:alpine   Up 2 seconds   6379/tcp', isError:false};
    if(c.includes('logs')) return {output:'web  | 172.17.0.1 - - [01/Jan/2024:00:00:01] "GET / HTTP/1.1" 200', isError:false};
    if(c.includes('down')) return {output:'[+] Running 3/3\n ✔ Container devops-lab-web-1    Removed\n ✔ Container devops-lab-cache-1  Removed\n ✔ Network devops-lab_default    Removed', isError:false};
    return {output:'', isError:false};
  }
  // for / while / if / variable assignment
  if(c.startsWith('for ') || c.startsWith('while ') || c.startsWith('if ')) {
    // Simulate basic loop output
    if(c.includes('{1..5}')) return {output:'1\n2\n3\n4\n5', isError:false};
    if(c.includes('{1..3}')) return {output:'1\n2\n3', isError:false};
    if(c.includes('tick')) return {output:'tick\ntick\ntick', isError:false};
    return {output:'', isError:false};
  }
  if(c.includes('=') && !c.includes('==') && !c.includes('if')) {
    if(c.includes('echo $')) {
      const varMatch = c.match(/([A-Z_]+)="([^"]+)"/);
      if(varMatch) return {output:varMatch[2], isError:false};
    }
    return {output:'', isError:false};
  }
  if(c.includes('echo $?')) return {output:'0', isError:false};
  if(base==='echo') return {output:parts.slice(1).join(' ').replace(/['"]/g,''), isError:false};
  if(c.includes('[') && c.includes('-f') && c.includes('echo')) return {output:'exists', isError:false};
  // trivy
  if(base==='trivy') return {output:'2024-01-01T00:00:00.000Z INFO  Detected OS: alpine 3.18\n2024-01-01T00:00:00.000Z INFO  Number of language-specific files: 1\n\nTotal: 0 (CRITICAL: 0, HIGH: 0, MEDIUM: 0)', isError:false};
  // Unknown command
  return {output:base+': command not found\nHint: try the suggested command above each exercise', isError:true};
}

function buildExerciseCard(dk, ex, idx, type) {
  const done = isLabDone(dk, ex.id);
  const avg = getLabAvg(dk, ex.id);
  const card = document.createElement('div');
  card.style = 'background:var(--s1);border:1px solid '+(done?'rgba(0,217,160,.35)':'var(--border)')+';border-radius:var(--r12);padding:14px 16px;margin-bottom:8px;transition:border-color .2s';
  card.innerHTML = '<div style="display:flex;align-items:flex-start;gap:10px">'
    +'<div style="width:22px;height:22px;border-radius:50%;background:'+(done?'var(--green)':'var(--s3)')+';border:1.5px solid '+(done?'var(--green)':'var(--border)')+';flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;margin-top:1px">'+(done?'<span style="color:#000;font-weight:700">✓</span>':'<span style="color:var(--sub)">'+(idx+1)+'</span>')+'</div>'
    +'<div style="flex:1">'
      +'<div style="font-size:13.5px;font-weight:600;margin-bottom:5px;color:'+(done?'var(--sub)':'var(--text)')+(done?';text-decoration:line-through':'')+'">'+ex.prompt+'</div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
        +'<button class="hint-toggle" data-exid="'+ex.id+'" style="background:none;border:1px solid var(--border);color:var(--sub);font-family:var(--mono);font-size:10px;padding:3px 9px;border-radius:4px;cursor:pointer">💡 Hint</button>'
        +(avg?'<span style="font-family:var(--mono);font-size:10px;color:var(--sub)">⏱ Your avg: '+formatTime(avg)+'</span>':'')
        +'<span style="font-family:var(--mono);font-size:10px;color:var(--amber)">+'+ex.xp+' XP</span>'
        +(done?'<span style="font-family:var(--mono);font-size:10px;color:var(--green)">'+ex.ok+'</span>':'')
      +'</div>'
      +'<div class="hint-box" id="hint-'+ex.id+'" style="display:none;margin-top:8px;background:var(--s3);border-radius:var(--r8);padding:8px 11px;font-family:var(--mono);font-size:11px;color:var(--amber);white-space:pre-wrap">'+ex.hint+'</div>'
    +'</div>'
  +'</div>';

  // Hint toggle
  setTimeout(function(){
    const hBtn = card.querySelector('.hint-toggle');
    const hBox = card.querySelector('#hint-'+ex.id);
    if(hBtn && hBox) hBtn.addEventListener('click', function(e){
      e.stopPropagation();
      const isOpen = hBox.style.display !== 'none';
      hBox.style.display = isOpen ? 'none' : 'block';
      hBtn.textContent = isOpen ? '💡 Hint' : '🙈 Hide hint';
    });
  },50);

  return card;
}

function formatTime(secs) {
  if(secs < 60) return secs+'s';
  return Math.floor(secs/60)+'m '+( secs%60)+'s';
}

// ── VIEW: CERTS ────────────────────────────────────────────────────────────────
function renderCerts() {
  const content = document.getElementById('certs-content');
  if(!content) return;
  content.innerHTML = '';

  Object.keys(CERT_MAP).forEach(function(certKey){
    const cert = CERT_MAP[certKey];
    const readiness = certReadiness(certKey);
    const isReady = readiness >= cert.passmark;

    const card = document.createElement('div');
    card.style = 'background:var(--s1);border:1px solid '+(isReady?'rgba(0,217,160,.4)':'var(--border)')+';border-radius:var(--r16);padding:20px;margin-bottom:14px';

    card.innerHTML = '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">'
      +'<div style="width:48px;height:48px;border-radius:12px;background:rgba('+hexToRgbStr(cert.color)+',.1);border:1px solid '+cert.color+';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+cert.logo+'</div>'
      +'<div style="flex:1">'
        +'<div style="font-size:15px;font-weight:700">'+cert.name+'</div>'
        +'<div style="font-family:var(--mono);font-size:11px;color:var(--sub);margin-top:3px">Pass mark: '+cert.passmark+'% · Your readiness: <span style="color:'+(isReady?'var(--green)':readiness>=50?'var(--amber)':'var(--red)')+'">'+readiness+'%</span></div>'
      +'</div>'
      +'<div style="flex-shrink:0">'
        +(isReady
          ?'<div style="background:rgba(0,217,160,.1);border:1px solid var(--green);color:var(--green);font-family:var(--mono);font-size:11px;padding:6px 12px;border-radius:var(--r8);text-align:center">✓ READY<br>to sit exam</div>'
          :'<div style="background:var(--s2);border:1px solid var(--border);color:var(--sub);font-family:var(--mono);font-size:11px;padding:6px 12px;border-radius:var(--r8);text-align:center">'+( cert.passmark-readiness)+'% gap<br>keep going</div>')
      +'</div>'
    +'</div>';

    // Domain bars
    const domsWrap = document.createElement('div');
    cert.domains.forEach(function(dom){
      const coveredDays = dom.days.filter(function(dayNum){
        let found=false;
        PHASES.forEach(function(ph,pi){
          ph.data.forEach(function(d,di){
            const dn = parseInt((d.day||'').replace('Day ',''));
            if(dn===dayNum && dayPct(pi,di)>=50) found=true;
          });
        });
        return found;
      });
      const domPct = dom.days.length ? Math.round(coveredDays.length/dom.days.length*100) : 0;
      const row = document.createElement('div');
      row.style = 'display:flex;align-items:center;gap:10px;margin-bottom:7px';
      row.innerHTML = '<span style="font-size:12px;flex:1;color:var(--sub)">'+dom.name+'</span>'
        +'<span style="font-family:var(--mono);font-size:10px;color:var(--muted);flex-shrink:0">'+dom.weight+'%</span>'
        +'<div style="width:120px;height:5px;background:var(--s3);border-radius:3px;overflow:hidden;flex-shrink:0"><div style="height:100%;background:'+cert.color+';border-radius:3px;width:'+domPct+'%;transition:width .5s"></div></div>'
        +'<span style="font-family:var(--mono);font-size:10px;color:var(--sub);width:30px;text-align:right;flex-shrink:0">'+domPct+'%</span>';
      domsWrap.appendChild(row);
    });
    card.appendChild(domsWrap);

    // Big progress bar + register link
    const bigBarWrap = document.createElement('div');
    bigBarWrap.style = 'margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:12px';
    bigBarWrap.innerHTML = '<div style="flex:1"><div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--sub);margin-bottom:5px"><span>Overall readiness</span><span style="color:'+cert.color+'">'+readiness+'%</span></div>'
      +'<div style="height:8px;background:var(--s3);border-radius:4px;overflow:hidden"><div style="height:100%;background:'+cert.color+';border-radius:4px;width:'+readiness+'%;transition:width .6s ease"></div></div></div>'
      +'<a href="'+cert.link+'" target="_blank" style="display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:11px;color:'+cert.color+';text-decoration:none;padding:7px 13px;border:1px solid '+cert.color+';border-radius:var(--r8);background:rgba('+hexToRgbStr(cert.color)+',.06);white-space:nowrap;flex-shrink:0">Register →</a>';
    card.appendChild(bigBarWrap);
    content.appendChild(card);
  });

  // Tips
  const tips = document.createElement('div');
  tips.style='background:var(--s2);border:1px solid var(--border);border-radius:var(--r12);padding:14px 16px;font-size:13px;color:var(--sub);line-height:1.8';
  tips.innerHTML='<strong style="color:var(--text);display:block;margin-bottom:4px">📋 GK\'s Cert Strategy</strong>'
    +'Start with <strong style="color:var(--text)">Terraform Associate</strong> around Day 45 (cheapest, fastest ROI on resume). Then <strong style="color:var(--text)">CKA</strong> after Day 70 — it\'s the gold standard for DevOps/Platform roles in India. AWS SAA if targeting cloud-first companies like AWS India, Freshworks, or Razorpay.';
  content.appendChild(tips);
}

function hexToRgbStr(hex) {
  if(!hex||hex.length<7) return '0,0,0';
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}

// ── VIEW: WEEKLY GOALS (replaces Streak Freeze) ────────────────────────────────
function renderWeeklyGoals() {
  const content = document.getElementById('weekly-content');
  if(!content) return;
  content.innerHTML = '';

  const weekDone = getWeekDone();
  const goal = getWeekGoal();
  const pct = Math.min(100, Math.round(weekDone/goal*100));
  const bounce = checkBounceback();

  // Bounce-back banner
  if(bounce) {
    const bb = document.createElement('div');
    bb.style='background:linear-gradient(135deg,rgba(255,200,80,.08),rgba(0,217,160,.08));border:1px solid rgba(255,200,80,.3);border-radius:var(--r12);padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px';
    bb.innerHTML='<span style="font-size:28px">🚀</span><div><div style="font-weight:700;font-size:14px">Bounce-back bonus!</div><div style="font-size:13px;color:var(--sub);margin-top:2px">You were away for 2+ days but you\'re back. Earn <strong style="color:var(--amber)">2× XP</strong> for every task completed today.</div></div>'
      +'<button id="claim-bounce" style="margin-left:auto;background:rgba(255,200,80,.12);border:1px solid rgba(255,200,80,.4);color:var(--amber);font-family:var(--mono);font-size:11px;padding:7px 14px;border-radius:var(--r8);cursor:pointer;white-space:nowrap">Activate 2× XP</button>';
    content.appendChild(bb);
    setTimeout(function(){
      const btn = document.getElementById('claim-bounce');
      if(btn) btn.addEventListener('click', function(){
        claimBounceback();
        showToast('🚀 2× XP activated for today!','rgba(255,200,80,.12)');
        renderWeeklyGoals();
      });
    },50);
  }

  // Main goal card
  const card = document.createElement('div');
  card.style='background:var(--s1);border:1px solid var(--border);border-radius:var(--r16);padding:20px;margin-bottom:14px';
  card.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<div><div style="font-family:var(--mono);font-size:11px;color:var(--green);margin-bottom:4px">WEEKLY GOAL</div>'
    +'<div style="font-size:28px;font-weight:800;font-family:var(--mono);color:var(--text)">'+weekDone+' <span style="font-size:16px;color:var(--sub)">/ '+goal+' tasks</span></div>'
    +'</div>'
    +'<div style="font-size:36px">'+(pct>=100?'🏆':pct>=70?'💪':pct>=40?'📚':'🎯')+'</div>'
    +'</div>'
    +'<div style="height:12px;background:var(--s3);border-radius:6px;overflow:hidden;margin-bottom:10px">'
    +'<div style="height:100%;border-radius:6px;background:linear-gradient(90deg,var(--green),var(--blue));width:'+pct+'%;transition:width .6s ease"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--sub)">'
    +'<span>'+pct+'% of weekly goal</span><span>'+(goal-weekDone>0?(goal-weekDone)+' tasks left this week':'🎉 Goal smashed!')+' </span></div>';

  // Goal adjuster
  const adj = document.createElement('div');
  adj.style='margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap';
  adj.innerHTML='<span style="font-family:var(--mono);font-size:11px;color:var(--sub)">Adjust weekly goal:</span>';
  [20,35,50,70,90].forEach(function(g){
    const btn = document.createElement('button');
    btn.style='background:'+(g===goal?'rgba(0,217,160,.12)':'var(--s2)')+';border:1px solid '+(g===goal?'var(--green)':'var(--border)')+';color:'+(g===goal?'var(--green)':'var(--sub)')+';font-family:var(--mono);font-size:11px;padding:4px 11px;border-radius:6px;cursor:pointer;transition:all .2s';
    btn.textContent=g+'/wk';
    btn.addEventListener('click', function(){ setWeekGoal(g); renderWeeklyGoals(); });
    adj.appendChild(btn);
  });
  card.appendChild(adj);
  content.appendChild(card);

  // Day-by-day breakdown
  const breakdownCard = document.createElement('div');
  breakdownCard.style='background:var(--s1);border:1px solid var(--border);border-radius:var(--r12);padding:16px';
  breakdownCard.innerHTML='<div style="font-family:var(--mono);font-size:11px;color:var(--sub);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">This week</div>';
  const wd = weekData(0);
  const maxDay = Math.max(1, ...wd.map(function(d){ return d.count; }));
  wd.forEach(function(day){
    const row = document.createElement('div');
    row.style='display:flex;align-items:center;gap:10px;margin-bottom:7px';
    const isToday = day.date === new Date().toDateString();
    row.innerHTML='<span style="font-family:var(--mono);font-size:11px;width:32px;color:'+(isToday?'var(--green)':'var(--sub)')+'">'+day.name+(isToday?' ←':'')+'</span>'
      +'<div style="flex:1;height:10px;background:var(--s3);border-radius:5px;overflow:hidden"><div style="height:100%;background:'+(isToday?'var(--green)':'var(--blue)')+';border-radius:5px;width:'+( day.isFuture?0:Math.round(day.count/maxDay*100))+'%;transition:width .4s"></div></div>'
      +'<span style="font-family:var(--mono);font-size:11px;color:var(--sub);width:55px;text-align:right">'+(day.isFuture?'—':day.count+' tasks')+'</span>';
    breakdownCard.appendChild(row);
  });
  content.appendChild(breakdownCard);

  // SR notification setup
  const notifCard = document.createElement('div');
  notifCard.style='background:var(--s1);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-top:12px';
  notifCard.innerHTML='<div style="font-family:var(--mono);font-size:11px;color:var(--sub);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Push Notifications for Spaced Repetition</div>'
    +'<div style="font-size:13px;color:var(--sub);margin-bottom:12px">Get notified when reviews are due. Works in Chrome and Edge on desktop/Android.</div>';
  const notifBtn = document.createElement('button');
  const hasPerm = 'Notification' in window && Notification.permission === 'granted';
  notifBtn.style='background:'+(hasPerm?'rgba(0,217,160,.08)':'var(--s2)')+';border:1px solid '+(hasPerm?'var(--green)':'var(--border)')+';color:'+(hasPerm?'var(--green)':'var(--text)')+';font-family:var(--mono);font-size:12px;padding:8px 16px;border-radius:var(--r8);cursor:pointer;transition:all .2s';
  notifBtn.textContent = hasPerm ? '✓ Notifications enabled' : '🔔 Enable review notifications';
  notifBtn.addEventListener('click', function(){
    if('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(function(p){
        if(p==='granted'){ showToast('✓ Notifications enabled! You\'ll be reminded when reviews are due.','rgba(0,217,160,.1)'); renderWeeklyGoals(); }
      });
    }
  });
  notifCard.appendChild(notifBtn);
  content.appendChild(notifCard);
}

// Register SW on load
document.addEventListener('DOMContentLoaded', function(){
  registerSW();

  // Bounce-back check on load
  if(checkBounceback()){
    setTimeout(function(){ showToast('🚀 Welcome back! You\'ve earned a bounce-back bonus. Check Weekly Goals!','rgba(255,200,80,.12)'); },2000);
  }
});
