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

// Simple modal helpers
function showModal({ title = '', content, submitText = 'Сохранить' }) {
  return new Promise((resolve, reject) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    const header = document.createElement('header');
    header.innerHTML = `<h3>${title}</h3>`;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'ghost';
    cancelBtn.textContent = 'Отмена';
    const okBtn = document.createElement('button');
    okBtn.textContent = submitText;
    actions.append(cancelBtn, okBtn);
    const err = document.createElement('div');
    err.style.color = 'var(--danger)'; err.style.fontSize = '12px'; err.style.minHeight = '16px'; err.style.marginTop = '4px';
    modal.append(header, content, err, actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    const close = () => { backdrop.remove(); };
    cancelBtn.onclick = () => { close(); resolve(null); };
    okBtn.onclick = () => { resolve({ close, setError: (m)=> err.textContent = m }); };
  });
}

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
      const res = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ login: fd.get('login'), password: fd.get('password') }),
      });
      // First login: must change credentials
      if (res && res.user && res.user.mustChange) {
        const form = document.createElement('div');
        form.innerHTML = `
          <p style="color:var(--muted)">Это первый вход. Пожалуйста, задайте новый логин и пароль.</p>
          <label>Новый логин<input id="newLogin" required /></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <label>Новый пароль<input id="newPass" type="password" required /></label>
            <label>Ещё раз пароль<input id="newPass2" type="password" required /></label>
          </div>`;
        const m = await showModal({ title: 'Смена учётных данных', content: form, submitText: 'Сохранить' });
        if (m) {
          const { close, setError } = m;
          const loginNew = form.querySelector('#newLogin').value.trim().toLowerCase();
          const p1 = form.querySelector('#newPass').value;
          const p2 = form.querySelector('#newPass2').value;
          if (!loginNew || !p1) { setError('Заполните поля'); return; }
          if (p1 !== p2) { setError('Пароли не совпадают'); return; }
          try {
            await api('/api/users', { method: 'PUT', body: JSON.stringify({ login: loginNew, password: p1 }) });
            close();
          } catch (err) {
            setError(err.message);
            return;
          }
        }
      }
      renderApp();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function renderEmployees() {
  const view = el('#view');
  let items = await api('/api/employees');
  view.innerHTML = `
    <section class="bar">
      <input id="emplSearch" placeholder="Поиск по ФИО/должности" />
      <span style="flex:1"></span>
      ${window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin') ? '<button id="addEmployee">Добавить сотрудника</button>' : ''}
    </section>
    <div class="card">
      <ul id="emplListFull" class="empl-list"></ul>
    </div>
  `;
  const listEl = el('#emplListFull');
  function renderList(){
    const q = (el('#emplSearch').value || '').toLowerCase();
    const filtered = (items || []).filter(e => (e.fullName||'').toLowerCase().includes(q) || (e.position||'').toLowerCase().includes(q));
    listEl.innerHTML = filtered.map(e => `<li><div class="empl-name">${e.fullName}</div><div class="empl-pos">${e.position||''}</div></li>`).join('');
  }
  el('#emplSearch').addEventListener('input', renderList);
  renderList();
  const addBtn = el('#addEmployee');
  if (addBtn) {
    addBtn.onclick = async () => {
      const form = document.createElement('div');
      form.innerHTML = `
        <label>ФИО<input id="fFullName" placeholder="Иванов Иван Иванович" required /></label>
        <label>Должность<input id="fPosition" placeholder="Менеджер" required /></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label>Телефон<input id="fPhone" placeholder="+79991234567" /></label>
          <label>Email<input id="fEmail" type="email" placeholder="name@example.com" /></label>
        </div>`;
      const res = await showModal({ title: 'Добавить сотрудника', content: form, submitText: 'Создать' });
      if (!res) return;
      const { close, setError } = res;
      const fullName = form.querySelector('#fFullName').value.trim();
      const position = form.querySelector('#fPosition').value.trim();
      const phone = form.querySelector('#fPhone').value.trim();
      const email = form.querySelector('#fEmail').value.trim();
      if (!fullName || !position) { setError('Заполните ФИО и должность'); return; }
      try {
        const created = await api('/api/employees', { method: 'POST', body: JSON.stringify({ fullName, position, phone, email }) });
        items = await api('/api/employees');
        renderList();
        close();
        // Show generated credentials once
        if (created && created.credentials) {
          const info = document.createElement('div');
          info.innerHTML = `
            <p>Учётная запись создана. Передайте сотруднику эти данные для первого входа:</p>
            <div class="card" style="margin:0">
              <div><strong>Логин:</strong> <code>${created.credentials.login}</code></div>
              <div><strong>Пароль:</strong> <code>${created.credentials.password}</code></div>
            </div>
            <p style="color:var(--muted)">При первом входе система попросит задать собственные логин и пароль.</p>`;
          await showModal({ title: 'Данные для входа', content: info, submitText: 'Готово' });
        }
      } catch (e) { setError(e.message); }
    };
  }
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
        ${(me.role === 'root' || me.role === 'admin') ? `
          <button id="nav-models">Модели</button>
          <button id="nav-schedule">Расписание</button>
          <button id="nav-employees">Сотрудники</button>
        ` : ''}
      </nav>
      <div class="me">${me ? me.login + ' (' + me.role + ')' : ''}
        <button id="logout">Выход</button>
      </div>
    </header>
    <main id="view"></main>
  `;
  el('#logout').onclick = async () => { await api('/api/logout', { method: 'POST' }); renderLogin(); };
  if (me.role === 'root' || me.role === 'admin') {
    el('#nav-models').onclick = renderModels;
    el('#nav-schedule').onclick = renderSchedule;
    el('#nav-employees').onclick = renderEmployees;
  }
}

async function renderModels() {
  if (!(window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin'))) {
    el('#view').innerHTML = `<div class="card"><h3>Недостаточно прав</h3><p>Доступно только администраторам.</p></div>`;
    return;
  }
  const view = el('#view');
  const data = await api('/api/models');
  let items = data.items || [];
  view.innerHTML = `
    <section class="bar">
      ${(window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin')) ? '<button id="addModel">Добавить модель</button>' : ''}
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
  const addBtn = el('#addModel');
  if (addBtn) {
    addBtn.onclick = async () => {
      const name = prompt('Имя модели');
      if (!name) return;
      await api('/api/models', { method: 'POST', body: JSON.stringify({ name }) });
      renderModels();
    };
  }
}

async function renderModelCard(id) {
  if (!(window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin'))) {
    el('#view').innerHTML = `<div class="card"><h3>Недостаточно прав</h3><p>Доступно только администраторам.</p></div>`;
    return;
  }
  const view = el('#view');
  const model = await api('/api/models?id=' + encodeURIComponent(id));
  const filesRes = await api('/api/files?modelId=' + encodeURIComponent(id));
  let files = filesRes.items || [];
  view.innerHTML = `
    <div class="card">
      <h2>${model.name}</h2>
      <p>${model.note || ''}</p>
      <section class="bar" style="gap:8px;flex-wrap:wrap">
        <form id="fileForm" style="display:${(window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin')) ? 'flex' : 'none'};gap:8px;flex-wrap:wrap">
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
      <div id="filePreview" style="margin-top:12px"></div>
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
    listEl.innerHTML = sorted.map(f => {
      const viewUrl = f.url; // inline view
      const downloadUrl = f.url + (f.url.includes('?') ? '&' : '?') + 'download=1';
      const canDownload = (window.currentUser && window.currentUser.role === 'root');
      return `<li>
        <strong>${f.name}</strong> — ${f.description || ''}
        [<a href="${viewUrl}" target="_blank">Просмотр</a>]
        ${canDownload ? `[<a href="${downloadUrl}">Скачать</a>]` : ''}
      </li>`;
    }).join('');
    // attach inline preview on click of Просмотр without leaving page
    [...listEl.querySelectorAll('a')].forEach(a => {
      if (a.textContent === 'Просмотр') {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          const li = a.closest('li');
          const name = li.querySelector('strong')?.textContent || '';
          const item = sorted.find(x => x.name === name);
          const box = el('#filePreview');
          if (!item) { window.open(a.href, '_blank'); return; }
          const ct = (item.contentType || '').toLowerCase();
          const src = a.href;
          if (ct.startsWith('image/')) {
            box.innerHTML = `<img src="${src}" alt="${name}" style="max-width:100%;max-height:60vh;object-fit:contain;border:1px solid #eee;padding:4px"/>`;
          } else if (ct === 'application/pdf') {
            box.innerHTML = `<iframe src="${src}" style="width:100%;height:60vh;border:1px solid #eee"></iframe>`;
          } else if (ct.startsWith('audio/')) {
            box.innerHTML = `<audio src="${src}" controls style="width:100%"></audio>`;
          } else if (ct.startsWith('video/')) {
            box.innerHTML = `<video src="${src}" controls style="width:100%;max-height:60vh;background:#000"></video>`;
          } else {
            window.open(src, '_blank');
          }
          box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
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
  if (!(window.currentUser && (window.currentUser.role === 'root' || window.currentUser.role === 'admin'))) {
    el('#view').innerHTML = `<div class="card"><h3>Недостаточно прав</h3><p>Доступно только администраторам.</p></div>`;
    return;
  }
  const view = el('#view');
  const now = new Date();
  let date = now.toISOString().slice(0,10);
  const PX_PER_MIN = 2; // scale
  const DAY_START = 8*60, DAY_END = 22*60; // 08:00 - 22:00

  const [data, employees] = await Promise.all([
    api('/api/schedule?date=' + date),
    api('/api/employees')
  ]);
  view.innerHTML = `
    <section class="bar">
      <button id="addEvent">Создать слот</button>
      <input id="pickDate" type="date" value="${date}" />
    </section>
    <div class="sched-layout">
      <aside class="sched-left">
        <h4>Сотрудники</h4>
        <ul id="emplList" class="empl-list"></ul>
      </aside>
      <div class="sched-right">
        <div class="tl-scroll">
          <div class="tl-header" id="tlHeader"></div>
          <div class="timeline" id="timeline">
            <div class="tl-grid" id="tlGrid"></div>
            <div class="tl-events" id="tlEvents"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  // render employees list (only full names)
  const emplUl = el('#emplList');
  emplUl.innerHTML = (employees || []).map(e => `<li><div class="empl-name">${e.fullName}</div></li>`).join('');

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
      const emp = (employees || []).find(e => e.id === ev.employeeId);
      const empLabel = emp ? ` • ${emp.fullName}` : '';
      node.title = `${ev.title || 'Слот'}${emp ? ' ('+emp.fullName+')' : ''} ${hmFromISO(ev.startISO)}–${hmFromISO(ev.endISO)}`;
      node.innerHTML = `<span class="tl-title">${(ev.title || 'Слот') + empLabel}</span><span class="tl-resize left"></span><span class="tl-resize right"></span>`;
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
    const form = document.createElement('div');
    const defaultStart = timeStr(now);
    const defaultEnd = timeStr(new Date(now.getTime()+3600000));
    form.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label>Начало<input id="evStart" placeholder="HH:MM" value="${defaultStart}" /></label>
        <label>Конец<input id="evEnd" placeholder="HH:MM" value="${defaultEnd}" /></label>
      </div>
      <label>Заголовок<input id="evTitle" placeholder="Название слота" /></label>
      <label>Сотрудник
        <select id="evEmployee">
          <option value="">— Без сотрудника —</option>
          ${(employees||[]).map(e=>`<option value="${e.id}">${e.fullName}</option>`).join('')}
        </select>
      </label>`;
    const res = await showModal({ title: 'Создать слот', content: form, submitText: 'Создать' });
    if (!res) return;
    const { close, setError } = res;
    const start = form.querySelector('#evStart').value.trim();
    const end = form.querySelector('#evEnd').value.trim();
    const title = form.querySelector('#evTitle').value.trim();
    const employeeId = form.querySelector('#evEmployee').value || null;
    if (!start || !end) { setError('Укажите время начала и конца'); return; }
    try {
      await api('/api/schedule', { method: 'POST', body: JSON.stringify({ date, start, end, title, employeeId }) });
      const fresh = await api('/api/schedule?date=' + date);
      renderEvents(fresh.items || []);
      close();
    } catch (e) { setError(e.message); }
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
  window.currentUser = me;
  renderAppShell(me);
  if (me.role === 'root' || me.role === 'admin') {
    renderModels();
  } else {
    el('#view').innerHTML = `<div class="card"><h3>Добро пожаловать</h3><p>У вас нет доступа к административным разделам. Обратитесь к администратору.</p></div>`;
  }
}

renderApp();
