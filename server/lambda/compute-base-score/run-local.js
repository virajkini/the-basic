/**
 * Local runner — loads server/.env then invokes the Lambda handler.
 * Usage: npm run compute:base-score
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRequire = createRequire(path.join(__dirname, '../../package.json'));

try {
  serverRequire('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch {
  // optional
}

const { handler } = await import('./index.js');
const result = await handler({}, {});
console.log(JSON.stringify(JSON.parse(result.body), null, 2));
process.exit(result.statusCode === 200 ? 0 : 1);
