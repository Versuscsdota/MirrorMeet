import { json, cookieSerialize } from '../_utils.js';

export async function POST(env, request) {
  const { SESSION_COOKIE_NAME = 'mirrorsid' } = env;
  const cookie = cookieSerialize(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return json({ ok: true }, { headers: { 'set-cookie': cookie } });
}
