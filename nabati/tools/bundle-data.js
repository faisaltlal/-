#!/usr/bin/env node
/**
 * يولّد engine/js/data.generated.js من data/*.json.
 *
 * السبب: صفحة المتصفح تُفتح أحيانًا من file:// حيث يفشل fetch، ومن
 * مضيفات ثابتة لا تضبط CORS. تضمين البيانات وحدةً جافاسكربتية يجعل
 * الصفحة تعمل في كل الحالات بلا خادم.
 *
 * ملفات JSON تبقى هي المصدر الوحيد للحقيقة — تقرؤها حزمة Swift أيضًا.
 * فحص `--check` يفشل إن كان المولَّد قديمًا، ويُشغَّل في CI.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dataDir = join(root, 'data');
const target = join(root, 'engine', 'js', 'data.generated.js');
// حزمة Swift لا تقرأ ملفًا خارج مجلد هدفها، فتُنسخ البيانات إليها.
// النسخ مولَّدة لا مصادر: فحص --check يفشل إن اختلفت عن data/.
const swiftResources = join(root, 'swift', 'Sources', 'NabatiProsody', 'Resources');

const FILES = {
  tafaeel: 'tafaeel.json',
  variations: 'variations.json',
  meters: 'meters.json',
  scoring: 'scoring.json',
  encodings: 'encodings.json',
  lexicon: 'lexicon.json',
  goldenCases: 'golden_cases.json',
};

function build() {
  const bundle = {};
  for (const [key, file] of Object.entries(FILES)) {
    const path = join(dataDir, file);
    if (!existsSync(path)) throw new Error(`ملف بيانات مفقود: ${file}`);
    bundle[key] = JSON.parse(readFileSync(path, 'utf8'));
  }
  const body = JSON.stringify(bundle, null, 2);
  return `// مولَّد آليًا من nabati/data/*.json — لا تحرّره يدويًا.
// أعِد التوليد بـ: node nabati/tools/bundle-data.js
export const DATA = ${body};
export default DATA;
`;
}

const generated = build();
const check = process.argv.includes('--check');
let stale = [];

if (check) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== generated) stale.push('engine/js/data.generated.js');
} else {
  writeFileSync(target, generated);
  console.log(`✓ كُتب ${target} (${(generated.length / 1024).toFixed(1)} كيلوبايت)`);
}

// نسخ Swift
if (!check) mkdirSync(swiftResources, { recursive: true });
for (const file of Object.values(FILES)) {
  const src = readFileSync(join(dataDir, file), 'utf8');
  const dst = join(swiftResources, file);
  if (check) {
    const cur = existsSync(dst) ? readFileSync(dst, 'utf8') : '';
    if (cur !== src) stale.push(`swift/…/Resources/${file}`);
  } else {
    writeFileSync(dst, src);
  }
}

if (check) {
  if (stale.length) {
    console.error('✗ نسخ البيانات المولَّدة قديمة:');
    for (const s of stale) console.error('  • ' + s);
    console.error('  شغّل: node nabati/tools/bundle-data.js');
    process.exit(1);
  }
  console.log('✓ كل نسخ البيانات المولَّدة تطابق data/*.json');
} else {
  console.log(`✓ نُسخت ${Object.keys(FILES).length} ملفات بيانات إلى حزمة Swift`);
}
