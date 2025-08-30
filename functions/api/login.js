import { json, text, badRequest, cookieSerialize, sha256, newId, firstUserExists, incUserCount, makeJwt } from '../_utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { SESSION_COOKIE_NAME = 'mirrorsid', SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 } = env;

    let body;
    try { body = await request.json(); } catch { return badRequest('Expect JSON'); }
    const login = (body.login || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!login || !password) return badRequest('login/password required');

    const loginKey = `user_login:${login}`;
    let userId = await env.CRM_KV.get(loginKey);

    // bootstrap: first user becomes root
    if (!userId) {
      const exists = await firstUserExists(env);
      if (!exists) {
        const id = newId('usr');
        const user = { id, login, role: 'root', fullName: 'Root', createdAt: Date.now() };
        const passHash = await sha256(password);
        await env.CRM_KV.put(`user:${id}`, JSON.stringify({ ...user, passHash }));
        await env.CRM_KV.put(loginKey, id);
        await incUserCount(env);
        userId = id;
      }
    }

    if (!userId) return text('Неверный логин или пароль', { status: 401 });
    const stored = await env.CRM_KV.get(`user:${userId}`, { type: 'json' });
    if (!stored) return text('Пользователь не найден', { status: 404 });
    const passHash = await sha256(password);
    if (stored.passHash !== passHash) return text('Неверный логин или пароль', { status: 401 });

    const exp = Date.now() + Number(SESSION_TTL_SECONDS) * 1000;
    try {
      const sid = newId('sid');
      await env.CRM_KV.put(`session:${sid}`, JSON.stringify({ userId: stored.id, exp }), { expirationTtl: Number(SESSION_TTL_SECONDS) });
      const cookie = cookieSerialize(SESSION_COOKIE_NAME, sid, { maxAge: Number(SESSION_TTL_SECONDS), path: '/' });
      return json({ ok: true, user: { id: stored.id, login: stored.login, role: stored.role, mustChange: !!stored.mustChange } }, { headers: { 'set-cookie': cookie } });
    } catch (e) {
      // KV write failed (e.g., daily limit). Fallback to stateless cookie if secret provided.
      const secret = env.SESSION_HMAC_SECRET;
      if (!secret) throw e;
      const token = await makeJwt({ userId: stored.id, exp }, secret);
      const cookie = cookieSerialize(SESSION_COOKIE_NAME, 'jwt.' + token, { maxAge: Number(SESSION_TTL_SECONDS), path: '/' });
      return json({ ok: true, user: { id: stored.id, login: stored.login, role: stored.role, mustChange: !!stored.mustChange } }, { headers: { 'set-cookie': cookie } });
    }
  } catch (err) {
    return text(`Login error: ${err?.message || String(err)}`, { status: 500 });
  }
}
