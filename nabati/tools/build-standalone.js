#!/usr/bin/env node
/**
 * يولّد nabati/web/standalone.html — ملف واحد مكتفٍ بذاته.
 *
 * السبب عملي بحت: الصفحة العادية تستورد وحدات ES، وهذا يوجب مضيفًا
 * يضبط أنواع MIME صحيحة. الملف الواحد يفتح من أي مكان — رابط معاينة
 * فرع، أو ملف محفوظ، أو بلا إنترنت أصلًا — وهو ما يناسب التجربة من
 * تابلت قبل أن يصير للمشروع موقع منشور.
 *
 * ليس نسخة ثانية من المحرك: يحزم الملفات نفسها التي تشغّلها
 * الاختبارات، فلا يمكن أن ينحرف عنها.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const ENTRY = join(root, 'web', 'app.js');

/** يستخرج تبعيات وحدة وأسماء ما تصدّره وما تستورده. */
function parse(file) {
  const src = readFileSync(file, 'utf8');
  const deps = [];
  const importedNames = [];

  // import { a, b } from './x.js';   (يدعم الامتداد على أسطر)
  // مثبّت في أول السطر عمدًا: أمثلة الاستيراد داخل التعليقات تبدأ
  // بـ « * » فلا تُلتقط، وإلا حُوّل تعليقٌ إلى تبعية وهمية.
  const body = src.replace(
    /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]\s*;?/gm,
    (_, names, spec) => {
      const resolved = resolve(dirname(file), spec);
      deps.push(resolved);
      const list = names.split(',').map((n) => n.trim()).filter(Boolean);
      importedNames.push(...list);
      return `const { ${list.join(', ')} } = __M;`;
    }
  );

  const exported = new Set();
  let out = body;

  // export function foo(  /  export const X =
  out = out.replace(/^export\s+(function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm,
    (_, kind, name) => { exported.add(name); return `${kind} ${name}`; });

  // export { a, b };
  out = out.replace(/^export\s*\{([^}]*)\}\s*;?/gm, (_, names) => {
    for (const n of names.split(',').map((s) => s.trim()).filter(Boolean)) {
      exported.add(n.split(/\s+as\s+/).pop().trim());
    }
    return '';
  });

  // export default X;  — لا نحتاجه في الحزمة
  out = out.replace(/^export\s+default\s+[^;]+;?/gm, '');

  // إعادة التصدير ليست تعريفًا جديدًا: index.js يصدّر أسماء استوردها،
  // وتسجيلها ثانيةً يبدو تصادمًا وهو ليس كذلك. الاسم في __M أصلًا.
  const own = [...exported].filter((n) => !importedNames.includes(n));
  return { file, deps, body: out, exported: own };
}

/** ترتيب طوبولوجي: التبعية قبل من يعتمد عليها. */
function collect(entry) {
  const seen = new Map();
  const order = [];
  const visiting = new Set();

  function visit(file) {
    if (seen.has(file)) return;
    if (visiting.has(file)) throw new Error(`دورة في الاستيراد عند ${file}`);
    visiting.add(file);
    const mod = parse(file);
    for (const d of mod.deps) visit(d);
    visiting.delete(file);
    seen.set(file, mod);
    order.push(mod);
  }
  visit(entry);
  return order;
}

const modules = collect(ENTRY);

// حارس: تصادُم اسمين مصدَّرين يجعل وحدةً تدهس أخرى بصمت.
const owner = new Map();
for (const m of modules) {
  for (const name of m.exported) {
    if (owner.has(name)) {
      throw new Error(
        `تصادم اسم مصدَّر «${name}» بين ${relative(root, owner.get(name))} و ${relative(root, m.file)}`
      );
    }
    owner.set(name, m.file);
  }
}

const bundle = modules.map((m) => {
  const reg = m.exported.length
    ? `\n  Object.assign(__M, { ${m.exported.join(', ')} });`
    : '';
  // كل وحدة في كتلة مستقلة: تصريحات الكتلة في الوضع الصارم محصورة
  // فيها، فلا تتصادم دالة round في وحدة مع مثيلتها في أخرى.
  return `// ── ${relative(root, m.file)} ──\n{\n${m.body}${reg}\n}\n`;
}).join('\n');

const html = readFileSync(join(root, 'web', 'index.html'), 'utf8');
const css = readFileSync(join(root, 'web', 'style.css'), 'utf8');

const out = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`)
  .replace(
    '<script type="module" src="app.js"></script>',
    `<script type="module">\nconst __M = {};\n${bundle}</script>`
  )
  .replace('<title>محرك عروض الشعر النبطي — واجهة تجربة</title>',
           '<title>محرك عروض الشعر النبطي — ملف واحد</title>');

if (out.includes('src="app.js"') || out.includes('href="style.css"')) {
  throw new Error('لم يُستبدل أحد المراجع الخارجية — الملف ليس مكتفيًا بذاته');
}

const target = join(root, 'web', 'standalone.html');

if (process.argv.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== out) {
    console.error('✗ standalone.html قديم — شغّل: node nabati/tools/build-standalone.js');
    process.exit(1);
  }
  console.log('✓ standalone.html محدَّث');
} else {
  writeFileSync(target, out);
  console.log(`✓ standalone.html — ${modules.length} وحدة، ${(out.length / 1024).toFixed(0)} كيلوبايت`);
}
