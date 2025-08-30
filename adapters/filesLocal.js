import fs from 'fs';
import path from 'path';

export function createFiles(baseDir) {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  async function put(objectKey, data, { httpMetadata } = {}) {
    const target = path.join(baseDir, objectKey);
    const dir = path.dirname(target);
    await fs.promises.mkdir(dir, { recursive: true });
    // data can be web ReadableStream, Node stream, Buffer, or string
    if (data && typeof data.getReader === 'function') {
      // web stream -> buffer
      const reader = data.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
      await fs.promises.writeFile(target, Buffer.concat(chunks));
    } else if (data && typeof data.pipe === 'function') {
      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(target);
        data.pipe(ws);
        ws.on('finish', resolve);
        ws.on('error', reject);
      });
    } else {
      await fs.promises.writeFile(target, Buffer.isBuffer(data) ? data : Buffer.from(data || ''));
    }
  }

  async function get(objectKey) {
    const target = path.join(baseDir, objectKey);
    const buf = await fs.promises.readFile(target);
    // Return body as Uint8Array so Web Response can send it
    return { body: new Uint8Array(buf) };
  }

  async function del(objectKey) {
    const target = path.join(baseDir, objectKey);
    await fs.promises.unlink(target).catch(() => {});
  }

  return { put, get, delete: del };
}
