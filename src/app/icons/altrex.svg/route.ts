import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SPRITE_PATH = path.join(process.cwd(), 'node_modules', '@altrex-ui', 'icons', 'altrex.svg');

let cachedSprite: Buffer | null = null;

export async function GET() {
  if (!cachedSprite) {
    cachedSprite = await readFile(SPRITE_PATH);
  }

  return new Response(new Uint8Array(cachedSprite), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
