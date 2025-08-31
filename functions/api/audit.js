import { json, badRequest } from '../_utils.js';
import { requireRole } from '../_utils.js';

function isValidDateStr(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const { error } = await requireRole(env, request, ['root','admin']);
  if (error) return error;

  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const action = (url.searchParams.get('action') || '').trim();
  const actor = (url.searchParams.get('actor') || '').trim(); // login or id substring
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  const cursorParam = url.searchParams.get('cursor');

  let start = from && isValidDateStr(from) ? from : new Date().toISOString().slice(0, 10);
  let end = to && isValidDateStr(to) ? to : start;
  if (start > end) return badRequest('from > to');

  // Cursor format: base64(JSON.stringify({ day, cursor }))
  let day = end;
  let innerCursor = undefined;
  if (cursorParam) {
    try {
      const dec = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf8'));
      if (dec && dec.day && isValidDateStr(dec.day)) {
        day = dec.day;
        innerCursor = dec.cursor || undefined;
      }
    } catch {}
  }

  const items = [];
  let nextCursor = null;

  while (day >= start && items.length < limit) {
    const prefix = `audit:${day}:`;
    const list = await env.CRM_KV.list({ prefix, cursor: innerCursor });
    for (const k of list.keys) {
      if (items.length >= limit) break;
      const entry = await env.CRM_KV.get(k.name, { type: 'json' });
      if (!entry) continue;
      if (action && entry.action !== action) continue;
      if (actor) {
        const a = entry.actor || {};
        const txt = `${a.id||''} ${a.login||''} ${a.role||''}`.toLowerCase();
        if (!txt.includes(actor.toLowerCase())) continue;
      }
      items.push({ key: k.name, ...entry });
    }
    // Determine pagination
    if (items.length >= limit) {
      nextCursor = Buffer.from(JSON.stringify({ day, cursor: list.cursor })).toString('base64');
      break;
    }
    if (list.list_complete === false && list.cursor) {
      // Continue same day
      innerCursor = list.cursor;
    } else {
      // Move to previous day
      day = addDays(day, -1);
      innerCursor = undefined;
      if (day < start) break;
    }
  }

  return json({ items, nextCursor });
}
