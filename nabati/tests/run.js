#!/usr/bin/env node
/**
 * مُشغّل كل الاختبارات. يعمل بـ node وحده بلا اعتماديات.
 *   node nabati/tests/run.js
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runAll } from './harness.js';

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => f.endsWith('.test.js')).sort();

console.log(`اختبارات محرك العروض النبطي — ${files.length} ملفًا\n${'─'.repeat(60)}`);

for (const f of files) {
  await import(join(here, f));
}

const { fail } = await runAll();
process.exit(fail ? 1 : 0);
