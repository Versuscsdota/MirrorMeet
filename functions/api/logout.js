import { json, cookieSerialize } from '../../_utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const { SESSION_COOKIE_NAME = 'mirrorsid' } = env;
  const cookie = cookieSerialize(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return json({ ok: true }, { headers: { 'set-cookie': cookie } });
}
