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
  view.innerHTML = `
    <section class="bar">
      <button id="addModel">Добавить модель</button>
      <input id="search" placeholder="Поиск" />
    </section>
    <div class="grid">${data.items.map(m => `
      <div class="card">
        <h3>${m.name}</h3>
        <p>${m.note || ''}</p>
        <button data-id="${m.id}" class="openModel">Открыть</button>
      </div>`).join('')}</div>
  `;
  el('#addModel').onclick = async () => {
    const name = prompt('Имя модели');
    if (!name) return;
    await api('/api/models', { method: 'POST', body: JSON.stringify({ name }) });
    renderModels();
  };
  [...document.querySelectorAll('.openModel')].forEach(b => b.onclick = () => renderModelCard(b.dataset.id));
}

async function renderModelCard(id) {
  const view = el('#view');
  const model = await api('/api/models?id=' + encodeURIComponent(id));
  const files = await api('/api/files?modelId=' + encodeURIComponent(id));
  view.innerHTML = `
    <div class="card">
      <h2>${model.name}</h2>
      <p>${model.note || ''}</p>
      <form id="fileForm">
        <input type="file" name="file" required />
        <input name="name" placeholder="Название" required />
        <input name="description" placeholder="Описание" />
        <button>Загрузить</button>
      </form>
      <ul>${files.items.map(f => `<li><a href="${f.url}" target="_blank">${f.name}</a> — ${f.description || ''}</li>`).join('')}</ul>
    </div>`;
  el('#fileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('modelId', id);
    try {
      const res = await fetch('/api/files', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      renderModelCard(id);
    } catch (err) { alert(err.message); }
  });
}

function timeStr(d) { return d.toTimeString().slice(0,5); }

async function renderSchedule() {
  const view = el('#view');
  const now = new Date();
  const date = now.toISOString().slice(0,10);
  const data = await api('/api/schedule?date=' + date);
  view.innerHTML = `
    <section class="bar">
      <button id="addEvent">Создать слот</button>
      <span>${date}</span>
    </section>
    <div class="timeline" id="timeline"></div>
  `;
  const tl = el('#timeline');
  // simple textual timeline
  tl.innerHTML = data.items.map(ev => `<div class="event"><b>${ev.title || 'Слот'}</b> ${ev.start.slice(11,16)}–${ev.end.slice(11,16)} ${ev.modelId ? ' • модель ' + ev.modelId : ''}</div>`).join('') || '<i>Нет событий</i>';
  el('#addEvent').onclick = async () => {
    const start = prompt('Начало (HH:MM)', timeStr(now));
    const end = prompt('Конец (HH:MM)', timeStr(new Date(now.getTime()+3600000)));
    const title = prompt('Заголовок');
    if (!start || !end) return;
    await api('/api/schedule', { method: 'POST', body: JSON.stringify({ date, start, end, title }) });
    renderSchedule();
  };
}

async function renderApp() {
  const me = await fetchMe();
  if (!me) return renderLogin();
  renderAppShell(me);
  renderModels();
}

renderApp();
