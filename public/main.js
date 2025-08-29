const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

const el = (sel) => document.querySelector(sel);

function renderLogin() {
  el('#app').innerHTML = `
    <div class="card">
      <h2>Вход</h2>
      <form id="loginForm">
        <label>Логин<input name="login" required /></label>
        <label>Пароль<input name="password" type="password" required /></label>
        <button type="submit">Войти</button>
      </form>
      <p class="hint">Если это первый запуск — первый пользователь станет root.</p>
    </div>`;

  el('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ login: fd.get('login'), password: fd.get('password') }),
      });
      renderApp();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function fetchMe() {
  try {
    return await api('/api/users?me=1');
  } catch {
    return null;
  }
}

function renderAppShell(me) {
  el('#app').innerHTML = `
    <header>
      <div>MirrorCRM</div>
      <nav>
        <button id="nav-models">Модели</button>
        <button id="nav-schedule">Расписание</button>
      </nav>
      <div class="me">${me ? me.login + ' (' + me.role + ')' : ''}
        <button id="logout">Выход</button>
      </div>
    </header>
    <main id="view"></main>
  `;
  el('#logout').onclick = async () => { await api('/api/logout', { method: 'POST' }); renderLogin(); };
  el('#nav-models').onclick = renderModels;
  el('#nav-schedule').onclick = renderSchedule;
}

async function renderModels() {
  const view = el('#view');
  const data = await api('/api/models');
  let items = data.items || [];
  view.innerHTML = `
    <section class="bar">
      <button id="addModel">Добавить модель</button>
      <input id="search" placeholder="Поиск по имени/описанию" />
      <select id="sort">
        <option value="name-asc">Имя ↑</option>
        <option value="name-desc">Имя ↓</option>
      </select>
    </section>
    <div class="grid" id="modelsGrid"></div>
  `;
  const grid = el('#modelsGrid');
  function applySort(list, mode){
    const arr = [...list];
    if (mode === 'name-desc') arr.sort((a,b)=> (b.name||'').localeCompare(a.name||''));
    else arr.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return arr;
  }
  function renderList(){
    const q = (el('#search').value || '').toLowerCase();
    const mode = el('#sort').value;
    const filtered = items.filter(m => (m.name||'').toLowerCase().includes(q) || (m.note||'').toLowerCase().includes(q));
    const sorted = applySort(filtered, mode);
    grid.innerHTML = sorted.map(m => `
      <div class="card">
        <h3>${m.name}</h3>
        <p>${m.note || ''}</p>
        <button data-id="${m.id}" class="openModel">Открыть</button>
      </div>`).join('');
    [...grid.querySelectorAll('.openModel')].forEach(b => b.onclick = () => renderModelCard(b.dataset.id));
  }
  el('#search').addEventListener('input', renderList);
  el('#sort').addEventListener('change', renderList);
  renderList();
  el('#addModel').onclick = async () => {
    const name = prompt('Имя модели');
    if (!name) return;
    await api('/api/models', { method: 'POST', body: JSON.stringify({ name }) });
    renderModels();
  };
}

async function renderModelCard(id) {
  const view = el('#view');
  const model = await api('/api/models?id=' + encodeURIComponent(id));
  const filesRes = await api('/api/files?modelId=' + encodeURIComponent(id));
  let files = filesRes.items || [];
  view.innerHTML = `
    <div class="card">
      <h2>${model.name}</h2>
      <p>${model.note || ''}</p>
      <section class="bar" style="gap:8px;flex-wrap:wrap">
        <form id="fileForm" style="display:flex;gap:8px;flex-wrap:wrap">
          <input type="file" name="file" required />
          <input name="name" placeholder="Название" required />
          <input name="description" placeholder="Описание" />
          <button>Загрузить</button>
        </form>
        <input id="fileSearch" placeholder="Поиск по файлам" />
        <select id="fileSort">
          <option value="name-asc">Имя ↑</option>
          <option value="name-desc">Имя ↓</option>
        </select>
        <button id="exportCsv" type="button">Экспорт CSV</button>
      </section>
      <ul id="filesList"></ul>
    </div>`;
  const listEl = el('#filesList');
  function applyFileSort(arr, mode){
    const a = [...arr];
    if (mode === 'name-desc') a.sort((x,y)=> (y.name||'').localeCompare(x.name||''));
    else a.sort((x,y)=> (x.name||'').localeCompare(y.name||''));
    return a;
  }
  function renderFiles(){
    const q = (el('#fileSearch').value || '').toLowerCase();
    const mode = el('#fileSort').value;
    const filtered = files.filter(f => (f.name||'').toLowerCase().includes(q) || (f.description||'').toLowerCase().includes(q));
    const sorted = applyFileSort(filtered, mode);
    listEl.innerHTML = sorted.map(f => `<li><a href="${f.url}" target="_blank">${f.name}</a> — ${f.description || ''}</li>`).join('');
  }
  el('#fileSearch').addEventListener('input', renderFiles);
  el('#fileSort').addEventListener('change', renderFiles);
  el('#exportCsv').addEventListener('click', () => {
    const mode = el('#fileSort').value;
    const q = (el('#fileSearch').value || '').toLowerCase();
    const filtered = files.filter(f => (f.name||'').toLowerCase().includes(q) || (f.description||'').toLowerCase().includes(q));
    const sorted = applyFileSort(filtered, mode);
    const rows = [['name','description','url'], ...sorted.map(f => [f.name||'', f.description||'', f.url||''])];
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${model.name}-files.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  renderFiles();
  el('#fileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('modelId', id);
    try {
      const res = await fetch('/api/files', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      const fresh = await api('/api/files?modelId=' + encodeURIComponent(id));
      files = fresh.items || [];
      renderFiles();
    } catch (err) { alert(err.message); }
  });
}

function timeStr(d) { return d.toTimeString().slice(0,5); }

function hmFromISO(iso) { return iso.slice(11,16); }
function minutesFromHM(hm) { const [h,m] = hm.split(':').map(Number); return h*60 + m; }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

async function renderSchedule() {
  const view = el('#view');
  const now = new Date();
  let date = now.toISOString().slice(0,10);
  const PX_PER_MIN = 2; // scale
  const DAY_START = 8*60, DAY_END = 22*60; // 08:00 - 22:00

  const data = await api('/api/schedule?date=' + date);
  view.innerHTML = `
    <section class="bar">
      <button id="addEvent">Создать слот</button>
      <input id="pickDate" type="date" value="${date}" />
    </section>
    <div class="tl-scroll">
      <div class="tl-header" id="tlHeader"></div>
      <div class="timeline" id="timeline">
        <div class="tl-grid" id="tlGrid"></div>
        <div class="tl-events" id="tlEvents"></div>
      </div>
    </div>
  `;

  const header = el('#tlHeader');
  const grid = el('#tlGrid');
  const eventsLayer = el('#tlEvents');
  const width = (DAY_END - DAY_START) * PX_PER_MIN;
  el('#timeline').style.width = width + 'px';
  grid.style.width = width + 'px';
  eventsLayer.style.width = width + 'px';

  // build hour ticks
  let headerHtml = '';
  let gridHtml = '';
  for (let m = DAY_START; m <= DAY_END; m += 60) {
    const left = (m - DAY_START) * PX_PER_MIN;
    const hh = String(Math.floor(m/60)).padStart(2,'0');
    headerHtml += `<div class="tl-hour" style="left:${left}px">${hh}:00</div>`;
    gridHtml += `<div class="tl-vline" style="left:${left}px"></div>`;
  }
  header.innerHTML = headerHtml;
  grid.innerHTML = gridHtml;

  function renderEvents(items) {
    eventsLayer.innerHTML = '';
    items.forEach(ev => {
      const s = minutesFromHM(hmFromISO(ev.startISO));
      const e = minutesFromHM(hmFromISO(ev.endISO));
      const left = (s - DAY_START) * PX_PER_MIN;
      const width = Math.max(6, (e - s) * PX_PER_MIN);
      const node = document.createElement('div');
      node.className = 'tl-event';
      node.style.left = left + 'px';
      node.style.width = width + 'px';
      node.dataset.id = ev.id;
      node.dataset.date = ev.date;
      node.title = `${ev.title || 'Слот'} ${hmFromISO(ev.startISO)}–${hmFromISO(ev.endISO)}`;
      node.innerHTML = `<span class="tl-title">${ev.title || 'Слот'}</span><span class="tl-resize left"></span><span class="tl-resize right"></span>`;
      eventsLayer.appendChild(node);
    });
  }

  renderEvents(data.items || []);

  // interactions: drag move and resize
  let drag = null;
  function onDown(e){
    const target = e.target.closest('.tl-event');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const startX = e.clientX;
    const isLeft = e.target.classList.contains('left');
    const isRight = e.target.classList.contains('right');
    const ev = {
      id: target.dataset.id,
      date: target.dataset.date,
      leftPx: parseFloat(target.style.left),
      widthPx: parseFloat(target.style.width),
      mode: isLeft ? 'resize-left' : isRight ? 'resize-right' : 'move',
      startX,
      node: target,
    };
    drag = ev;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp, { once: true });
  }
  function onMove(e){
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (drag.mode === 'move'){
      const nextLeft = clamp(drag.leftPx + dx, 0, (DAY_END-DAY_START)*PX_PER_MIN - drag.widthPx);
      drag.node.style.left = nextLeft + 'px';
    } else if (drag.mode === 'resize-left'){
      const nextLeft = clamp(drag.leftPx + dx, 0, drag.leftPx + drag.widthPx - 6);
      const nextWidth = drag.widthPx + (drag.leftPx - nextLeft);
      drag.node.style.left = nextLeft + 'px';
      drag.node.style.width = Math.max(6, nextWidth) + 'px';
    } else if (drag.mode === 'resize-right'){
      const nextWidth = Math.max(6, drag.widthPx + dx);
      const maxWidth = (DAY_END-DAY_START)*PX_PER_MIN - drag.leftPx;
      drag.node.style.width = clamp(nextWidth, 6, maxWidth) + 'px';
    }
  }
  async function onUp(){
    document.removeEventListener('mousemove', onMove);
    const node = drag.node;
    const leftPx = parseFloat(node.style.left);
    const widthPx = parseFloat(node.style.width);
    drag = null;
    // convert to HM
    const startMin = Math.round(leftPx / PX_PER_MIN) + DAY_START;
    const endMin = Math.round((leftPx + widthPx) / PX_PER_MIN) + DAY_START;
    const toHM = (m)=> `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    try{
      await api('/api/schedule', { method:'PUT', body: JSON.stringify({ id: node.dataset.id, date: node.dataset.date, start: toHM(startMin), end: toHM(endMin) }) });
    }catch(err){ alert(err.message); }
  }
  eventsLayer.addEventListener('mousedown', onDown);

  el('#addEvent').onclick = async () => {
    const start = prompt('Начало (HH:MM)', timeStr(now));
    const end = prompt('Конец (HH:MM)', timeStr(new Date(now.getTime()+3600000)));
    const title = prompt('Заголовок');
    if (!start || !end) return;
    await api('/api/schedule', { method: 'POST', body: JSON.stringify({ date, start, end, title }) });
    const fresh = await api('/api/schedule?date=' + date);
    renderEvents(fresh.items || []);
  };

  el('#pickDate').addEventListener('change', async (e)=>{
    date = e.target.value;
    const fresh = await api('/api/schedule?date=' + date);
    renderEvents(fresh.items || []);
  });
}

async function renderApp() {
  const me = await fetchMe();
  if (!me) return renderLogin();
  renderAppShell(me);
  renderModels();
}

renderApp();
