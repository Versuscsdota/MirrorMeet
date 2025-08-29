import * as login from '../functions/api/login.js';
import * as logout from '../functions/api/logout.js';
import * as users from '../functions/api/users.js';
import * as models from '../functions/api/models.js';
import * as files from '../functions/api/files.js';
import * as schedule from '../functions/api/schedule.js';

async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  // Login / Logout
  if (pathname === '/api/login' && method === 'POST') return login.onRequestPost({ env, request, context: ctx });
  if (pathname === '/api/logout' && method === 'POST') return logout.onRequestPost({ env, request, context: ctx });

  // Users
  if (pathname === '/api/users') {
    if (method === 'GET') return users.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return users.onRequestPost({ env, request, context: ctx });
    if (method === 'DELETE') return users.onRequestDelete({ env, request, context: ctx });
  }

  // Models
  if (pathname === '/api/models') {
    if (method === 'GET') return models.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return models.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return models.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return models.onRequestDelete({ env, request, context: ctx });
  }

  // Files
  if (pathname === '/api/files') {
    if (method === 'GET') return files.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return files.onRequestPost({ env, request, context: ctx });
    if (method === 'DELETE') return files.onRequestDelete({ env, request, context: ctx });
  }

  // Schedule
  if (pathname === '/api/schedule') {
    if (method === 'GET') return schedule.onRequestGet({ env, request, context: ctx });
    if (method === 'POST') return schedule.onRequestPost({ env, request, context: ctx });
    if (method === 'PUT') return schedule.onRequestPut({ env, request, context: ctx });
    if (method === 'DELETE') return schedule.onRequestDelete({ env, request, context: ctx });
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, ctx);
    }
    // serve static assets from /public via [assets] binding
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Static assets not configured', { status: 500 });
  }
};
