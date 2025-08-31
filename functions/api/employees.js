import { json, badRequest, forbidden } from '../_utils.js';
import { requireRole, newId, sha256, incUserCount } from '../_utils.js';

// KV key: employee:<id>
// Stored object shape:
// { id, fullName, position, phone?, email?, department?, startDate?, notes?, telegram?, birthDate?, address?, city? }

function sanitizeStr(v, max = 120) {
  if (v == null) return '';
  return String(v).trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, max);
}

function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isPhone(v){ return /^[+0-9 ()-]{6,}$/.test(v); }

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const withStats = url.searchParams.get('withStats') === 'true';
  const from = url.searchParams.get('from'); // YYYY-MM-DD optional
  const to = url.searchParams.get('to');     // YYYY-MM-DD optional

  // Permissions:
  // - List (no id): root/admin/interviewer
  // - Single employee (id) or stats: root/admin only
  if (id || withStats) {
    const { error } = await requireRole(env, request, ['root','admin']);
    if (error) return error;
  } else {
    const { error } = await requireRole(env, request, ['root','admin','interviewer']);
    if (error) return error;
  }
  
  if (id) {
    // Get single employee with full details
    const employee = await env.CRM_KV.get(`employee:${id}`, { type: 'json' });
    if (!employee) return json({ error: 'Employee not found' }, { status: 404 });
    // Attach associated user's role if exists
    let role;
    try {
      const userList = await env.CRM_KV.list({ prefix: 'user:' });
      const users = await Promise.all(userList.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
      const associatedUser = users.find(u => u && u.employeeId === id);
      if (associatedUser) role = associatedUser.role;
    } catch {}
    const enriched = role ? { ...employee, role } : employee;
    if (!withStats) return json(enriched);
    // compute stats from slot:*
    const list = await env.CRM_KV.list({ prefix: 'slot:' });
    const slots = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
    const inRange = (s) => {
      if (!s || !s.date) return false;
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      return true;
    };
    const mine = slots.filter(s => s && s.employeeId === id && inRange(s));
    const parseHM = (hm) => {
      const [h,m] = String(hm||'').split(':').map(n=>parseInt(n||'0',10));
      if (Number.isNaN(h) || Number.isNaN(m)) return 0;
      return h*60 + m;
    };
    let minutes = 0;
    const byDay = {};
    for (const s of mine) {
      minutes += Math.max(0, parseHM(s.end) - parseHM(s.start));
      byDay[s.date] = (byDay[s.date] || 0) + 1;
    }
    const stats = {
      eventsCount: mine.length,
      hoursTotal: Math.round((minutes/60)*10)/10,
      byDay
    };
    return json({ ...enriched, stats });
  }
  
  // Get list of employees
  const list = await env.CRM_KV.list({ prefix: 'employee:' });
  const fetched = await Promise.all(list.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const items = fetched.filter(Boolean);
  items.sort((a,b)=> (a.fullName||'').localeCompare(b.fullName||''));
  return json(items);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return forbidden('Только администратор и root могут регистрировать новых пользователей');
  let body;
  try { body = await request.json(); } catch { return badRequest('Invalid JSON'); }
  let fullName = sanitizeStr(body.fullName, 160);
  let position = sanitizeStr(body.position, 80);
  let phone = sanitizeStr(body.phone || '', 40);
  let email = sanitizeStr(body.email || '', 120);
  let department = sanitizeStr(body.department || '', 80);
  let startDate = sanitizeStr(body.startDate || '', 20);
  let notes = sanitizeStr(body.notes || '', 500);
  let role = sanitizeStr(body.role || 'interviewer', 20);
  // Additional optional fields
  let telegram = sanitizeStr(body.telegram || '', 80);
  let birthDate = sanitizeStr(body.birthDate || '', 20);
  let address = sanitizeStr(body.address || '', 200);
  let city = sanitizeStr(body.city || '', 80);

  if (!fullName || !position) return badRequest('fullName и position обязательны');
  if (email && !isEmail(email)) return badRequest('Некорректный email');
  if (phone && !isPhone(phone)) return badRequest('Некорректный телефон');
  const allowedRoles = ['interviewer','curator','admin'];
  if (!allowedRoles.includes(role)) role = 'interviewer';

  const id = newId('emp');
  const employee = { 
    id, fullName, position, 
    ...(phone ? { phone } : {}), 
    ...(email ? { email } : {}),
    ...(department ? { department } : {}),
    ...(startDate ? { startDate } : {}),
    ...(notes ? { notes } : {}),
    ...(telegram ? { telegram } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(address ? { address } : {}),
    ...(city ? { city } : {})
  };
  await env.CRM_KV.put(`employee:${id}`, JSON.stringify(employee));

  // Create a user account with autogenerated credentials (first login must change)
  function genLogin() {
    const suffix = newId('').slice(0, 6);
    return `emp${suffix}`;
  }
  function genPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random()*alphabet.length)];
    return out;
  }
  // ensure unique login
  let login;
  for (let i = 0; i < 5; i++) {
    const candidate = genLogin();
    const exists = await env.CRM_KV.get(`user_login:${candidate}`);
    if (!exists) { login = candidate; break; }
  }
  if (!login) login = genLogin() + Date.now().toString(36).slice(-2);
  const password = genPassword();
  const passHash = await sha256(password);
  const userId = newId('usr');
  const user = { id: userId, login, role, fullName, employeeId: id, mustChange: true, createdAt: Date.now() };
  await env.CRM_KV.put(`user:${userId}`, JSON.stringify({ ...user, passHash }));
  await env.CRM_KV.put(`user_login:${login}`, userId);
  await incUserCount(env);

  return json({ ...employee, credentials: { login, password } }, { status: 201 });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  // Only root can delete employees
  const { error } = await requireRole(env, request, ['root']);
  if (error) return error;
  
  const url = new URL(request.url);
  let id = url.searchParams.get('id');
  // Fallback: allow id in JSON body for DELETE as well
  if (!id) {
    try {
      const body = await request.json();
      if (body && body.id) id = String(body.id);
    } catch {}
  }
  if (!id) return badRequest('Не указан id сотрудника (ожидается query ?id= или JSON { id })');
  
  const employee = await env.CRM_KV.get(`employee:${id}`, { type: 'json' });
  if (!employee) return json({ error: 'Employee not found', id }, { status: 404 });
  
  // Find and delete associated user account
  const userList = await env.CRM_KV.list({ prefix: 'user:' });
  const users = await Promise.all(userList.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const associatedUser = users.find(u => u && u.employeeId === id);
  
  if (associatedUser) {
    await env.CRM_KV.delete(`user:${associatedUser.id}`);
    await env.CRM_KV.delete(`user_login:${associatedUser.login}`);
  }
  
  // Delete all schedule events for this employee
  const slotList = await env.CRM_KV.list({ prefix: 'slot:' });
  const slotObjs = await Promise.all(slotList.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
  const toDelete = slotList.keys
    .map((k, i) => ({ key: k.name, obj: slotObjs[i] }))
    .filter(x => x.obj && x.obj.employeeId === id)
    .map(x => x.key);
  await Promise.all(toDelete.map(k => env.CRM_KV.delete(k)));
  
  // Delete employee
  await env.CRM_KV.delete(`employee:${id}`);
  
  return json({ ok: true });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  // Only root can edit employees
  const { error } = await requireRole(env, request, ['root']);
  if (error) return error;
  
  let body;
  try { body = await request.json(); } catch { return badRequest('Invalid JSON'); }
  
  const id = sanitizeStr(body.id);
  if (!id) return badRequest('id required');
  
  const employee = await env.CRM_KV.get(`employee:${id}`, { type: 'json' });
  if (!employee) return json({ error: 'Employee not found' }, { status: 404 });
  
  let fullName = sanitizeStr(body.fullName, 160);
  let position = sanitizeStr(body.position, 80);
  let phone = sanitizeStr(body.phone || '', 40);
  let email = sanitizeStr(body.email || '', 120);
  let department = sanitizeStr(body.department || '', 80);
  let startDate = sanitizeStr(body.startDate || '', 20);
  let notes = sanitizeStr(body.notes || '', 500);
  // Additional optional fields
  let telegram = sanitizeStr(body.telegram || '', 80);
  let birthDate = sanitizeStr(body.birthDate || '', 20);
  let address = sanitizeStr(body.address || '', 200);
  let city = sanitizeStr(body.city || '', 80);
  // Optional role update
  let roleNew = sanitizeStr(body.role || '', 20);

  if (!fullName || !position) return badRequest('fullName и position обязательны');
  if (email && !isEmail(email)) return badRequest('Некорректный email');
  if (phone && !isPhone(phone)) return badRequest('Некорректный телефон');

  const updatedEmployee = { 
    ...employee,
    fullName, 
    position, 
    ...(phone ? { phone } : {}), 
    ...(email ? { email } : {}),
    ...(department ? { department } : {}),
    ...(startDate ? { startDate } : {}),
    ...(notes ? { notes } : {}),
    ...(telegram ? { telegram } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(address ? { address } : {}),
    ...(city ? { city } : {})
  };
  
  await env.CRM_KV.put(`employee:${id}`, JSON.stringify(updatedEmployee));

  // Update associated user's role if provided and valid
  const allowedRoles = ['interviewer','curator','admin'];
  if (roleNew && allowedRoles.includes(roleNew)) {
    const userList = await env.CRM_KV.list({ prefix: 'user:' });
    const users = await Promise.all(userList.keys.map(k => env.CRM_KV.get(k.name, { type: 'json' })));
    const associatedUser = users.find(u => u && u.employeeId === id);
    if (associatedUser) {
      const updatedUser = { ...associatedUser, role: roleNew };
      await env.CRM_KV.put(`user:${associatedUser.id}`, JSON.stringify(updatedUser));
    }
  }
  
  return json({ ok: true, employee: updatedEmployee });
}
