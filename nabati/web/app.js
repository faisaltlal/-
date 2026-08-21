/**
 * واجهة تجربة المحرك في المتصفح.
 *
 * لا منطق عروضي هنا إطلاقًا — هذه طبقة عرض بحتة تستدعي المحرك نفسه
 * الذي تشغّله الاختبارات. أي فرق بين ما تراه هنا وما يعطيه `npm test`
 * يكون خطأ في العرض لا في المحرك.
 */

import { createEngine } from '../engine/js/index.js';
import { DATA } from '../engine/js/data.generated.js';
import { traceReport, dumpDag } from '../engine/js/debug/trace.js';

const engine = createEngine(DATA);
const $ = (s) => document.querySelector(s);
const pct = (x) => `${Math.round(x * 100)}%`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- التبويبات ---------------- */
const TABS = ['analyze', 'poem', 'train', 'meters', 'open'];
document.querySelectorAll('[role=tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.tab;
    document.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    TABS.forEach((id) => $('#tab-' + id).classList.toggle('hidden', id !== t));
  });
});

/* ---------------- أمثلة جاهزة ---------------- */
const SAMPLES = [
  ['المسحوب (مشكول)', 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ'],
  ['الهجيني (مشكول)', 'فَاعِلَاتُنْ فَعُولُنْ فَاعِلَاتُنْ فَعُولُنْ'],
  ['الهزج (مشكول)', 'مَفَاعِيلُنْ مَفَاعِيلُنْ مَفَاعِيلُنْ مَفَاعِيلُنْ'],
  ['الحدا (مشكول)', 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ'],
  ['شطران بفاصل', 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ ... مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ'],
  ['مزاحف (جائز)', 'مُتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ'],
  ['مكسور', 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَعُولُنْ'],
  ['غير مشكول', 'مستفعلن مستفعلن فاعلاتن'],
];
$('#samples').innerHTML = SAMPLES.map(
  (s, i) => `<button data-i="${i}">${esc(s[0])}</button>`
).join('');
$('#samples').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $('#input').value = SAMPLES[+b.dataset.i][1];
  runAnalyze();
});

/* ---------------- تحليل بيت ---------------- */
function runAnalyze() {
  const text = $('#input').value.trim();
  if (!text) { $('#result').classList.add('hidden'); return; }
  const t0 = performance.now();
  let r;
  try {
    r = engine.analyze(text, { debug: $('#debug').checked });
  } catch (err) {
    $('#result').classList.remove('hidden');
    $('#result').innerHTML = `<div class="panel"><div class="note warn">تعذّر التحليل: ${esc(err.message)}</div></div>`;
    return;
  }
  const ms = performance.now() - t0;
  $('#timing').textContent = `${ms.toFixed(0)} م.ث`;
  $('#result').classList.remove('hidden');
  $('#result').innerHTML = renderResult(r);
}
$('#run').addEventListener('click', runAnalyze);
$('#input').addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runAnalyze();
});

const VERDICT_LABEL = {
  sound: 'موزون',
  acceptable: 'موزون برخصة',
  broken: 'مكسور',
  unrecognized: 'غير محدَّد',
};

function renderResult(r) {
  if (!r.bestMeter) {
    return `<div class="panel"><div class="note warn"><strong>${esc(r.explanation.title)}</strong><br>${esc(r.explanation.text)}</div></div>`;
  }
  const m = r.bestMeter;
  const parts = [];

  parts.push(`<div class="panel">
    <div class="verdict">
      <span class="name">${esc(m.name)}</span>
      <span class="badge ${r.verdict}">${VERDICT_LABEL[r.verdict] || r.verdict}</span>
      ${m.repeat > 1 ? '<span class="badge">شطران</span>' : ''}
      ${m.status === 'NEEDS_VALIDATION' ? '<span class="badge broken">تعريفه يحتاج تحقّقًا</span>' : ''}
    </div>
    <div class="scores">
      <div class="score-box"><div class="n">${pct(m.score)}</div><div class="k">درجة المطابقة</div>
        <div class="bar"><i style="width:${(m.score * 100).toFixed(1)}%"></i></div></div>
      <div class="score-box"><div class="n">${pct(m.confidence)}</div><div class="k">الثقة</div>
        <div class="bar"><i style="width:${(m.confidence * 100).toFixed(1)}%"></i></div></div>
    </div>
    <div class="note">${esc(r.explanation.text)}</div>
    ${r.ambiguity ? `<div class="note warn"><strong>أكثر من بحر يوافق بالدرجة نفسها:</strong>
       ${r.ambiguity.tiedWith.map((t) => `${esc(t.name)} (${pct(t.score)})`).join('، ')}<br>
       ${esc(r.ambiguity.reason)}<br><em>${esc(r.ambiguity.advice)}</em></div>` : ''}
    ${r.vocalization.assumed ? `<div class="note warn"><strong>التشكيل مفترض.</strong> ${esc(r.vocalization.note)}</div>` : ''}
  </div>`);

  // التفعيلات
  if (r.tafaeel.length) {
    parts.push(`<div class="panel"><h2>التفعيلات</h2><div class="scroll"><table>
      <tr><th>#</th><th>التفعيلة</th><th>الصورة</th><th>المتوقَّع</th><th>الواقع</th><th>الكلمات</th></tr>
      ${r.tafaeel.map((f, i) => `<tr class="${f.sound === false ? 'bad' : ''}">
        <td>${i + 1}${f.hemistich ? `<small class="muted"> ش${f.hemistich + 1}</small>` : ''}</td>
        <td>${esc(f.tafila)}</td>
        <td>${esc(f.realized || '—')}<br><small class="muted">${esc(f.variation || '')}</small></td>
        <td class="pat">${esc(f.expected)}</td>
        <td class="pat">${esc(f.actual)}</td>
        <td>${esc((f.words || []).join(' '))}</td>
      </tr>`).join('')}
    </table></div></div>`);
  }

  // الكسر
  if (r.brokenFeet.length) {
    parts.push(`<div class="panel"><h2>موضع الكسر</h2>
      ${r.brokenFeet.map((b) => `<div class="note warn">
        <strong>التفعيلة ${b.footIndex + 1} — ${esc(b.tafila)}</strong><br>
        المتوقَّع <code>${esc(b.expected)}</code> والواقع <code>${esc(b.actual)}</code>
        ${b.issues.length ? '<ul style="margin:6px 0 0;padding-inline-start:18px">' + b.issues.map((i) => `<li>${esc(i.text)}</li>`).join('') + '</ul>' : ''}
      </div>`).join('')}
    </div>`);
  }

  // التقطيع
  parts.push(`<div class="panel"><h2>التقطيع والأنماط</h2>
    <p class="muted" style="margin:0 0 4px">الكتابة العروضية — النصّ كما يُنطق</p>
    <div style="font-size:1.1rem;line-height:2.2">${esc(r.prosodic)}</div>
    <p class="muted" style="margin:12px 0 0">المقاطع (${r.syllables.length})</p>
    <div class="syls">${r.syllables.map((s) => `<span class="syl ${s.weight}" title="${esc(s.shape || '')}${s.rule ? ' — ' + esc(s.rule) : ''}">${s.weight}<small> ${esc(s.shape || '')}</small></span>`).join('')}</div>
    <p class="muted" style="margin:12px 0 4px">النمط الداخلي</p>
    <div class="mono">${esc(r.internalPattern)}</div>
    ${Object.entries(r.numericPatterns).map(([id, e]) => `
      <p class="muted" style="margin:10px 0 4px">${esc(id)} <span class="badge">${esc(e.status)}</span></p>
      <div class="mono">${e.value === null ? '— غير مثبَّت، فلا يُخترع' : esc(e.value)}</div>`).join('')}
  </div>`);

  // البدائل
  if (r.alternatives.length) {
    parts.push(`<div class="panel"><h2>البحور البديلة</h2><ul class="alts">
      ${r.alternatives.map((a) => `<li><span>${esc(a.name)}</span><span class="pctn">${pct(a.score)}</span></li>`).join('')}
    </ul></div>`);
  }

  // التطبيع
  if (r.removed.length) {
    parts.push(`<div class="panel"><details><summary>ما حُذف في التطبيع (${r.removed.length})</summary>
      <ul class="muted" style="padding-inline-start:18px">${r.removed.map((x) => `<li>${esc(x.what)} ×${x.count} — ${esc(x.why)}</li>`).join('')}</ul>
    </details></div>`);
  }

  // التتبّع
  if (r._internal) {
    parts.push(`<div class="panel"><h2>التتبّع</h2>
      <pre class="mono">${esc(traceReport(r))}</pre>
      <details><summary>مخطّط المقاطع</summary><pre class="mono">${esc(dumpDag(r._internal.dag, r._internal.units))}</pre></details>
      <details><summary>الترتيب الكامل</summary><pre class="mono">${esc(r._internal.ranking.map((x) => `${x.score.toFixed(4)}  ${x.name}  cost=${x.cost}`).join('\n'))}</pre></details>
    </div>`);
  }

  return parts.join('');
}

/* ---------------- قصيدة ---------------- */
$('#runPoem').addEventListener('click', () => {
  const text = $('#poemInput').value.trim();
  if (!text) return;
  const r = engine.analyzePoem(text);
  $('#poemResult').innerHTML = `
    <div class="panel">
      <div class="verdict">
        <span class="name">${r.dominantMeter ? esc(r.dominantMeter.name) : 'لا بحر غالب'}</span>
        <span class="badge">الوزن الغالب</span>
      </div>
      <div class="scores">
        <div class="score-box"><div class="n">${r.lineCount}</div><div class="k">أبيات</div></div>
        <div class="score-box"><div class="n">${pct(r.consistency)}</div><div class="k">اتّساق</div></div>
        <div class="score-box"><div class="n">${r.unclear}</div><div class="k">غير واضح</div></div>
      </div>
    </div>
    <div class="panel"><h2>توزيع البحور</h2><div class="scroll"><table>
      <tr><th>البحر</th><th>أبيات</th><th>النسبة</th><th>متوسط الدرجة</th></tr>
      ${r.distribution.map((d) => `<tr><td>${esc(d.name)}</td><td>${d.lines}</td><td>${pct(d.share)}</td><td>${pct(d.averageScore)}</td></tr>`).join('')}
    </table></div></div>
    ${r.outliers.length ? `<div class="panel"><h2>الأبيات الخارجة (${r.outliers.length})</h2>
      ${r.outliers.map((o) => `<div class="note warn"><strong>البيت ${o.index + 1}</strong> — ${esc(o.reason)}<br><span class="muted">${esc(o.input)}</span></div>`).join('')}
    </div>` : ''}
    <div class="panel"><h2>كل بيت</h2><div class="scroll"><table>
      <tr><th>#</th><th>البيت</th><th>البحر</th><th>الدرجة</th><th>الحكم</th></tr>
      ${r.lines.map((l) => `<tr class="${l.verdict === 'broken' || l.verdict === 'unrecognized' ? 'bad' : ''}">
        <td>${l.index + 1}</td><td>${esc(l.input)}</td><td>${esc(l.meter || '—')}</td>
        <td>${pct(l.score)}</td><td>${VERDICT_LABEL[l.verdict] || l.verdict}</td></tr>`).join('')}
    </table></div></div>`;
});

/* ---------------- تدريب ---------------- */
const ex = engine.exercises();
$('#trainMeter').innerHTML = ex.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
function updateHint() {
  const e = ex.find((x) => x.id === $('#trainMeter').value);
  $('#trainHint').textContent = e ? `${e.tafaeel.join(' | ')} — ${e.syllableCount} مقطعًا` : '';
}
$('#trainMeter').addEventListener('change', updateHint);
updateHint();

$('#runTrain').addEventListener('click', () => {
  const r = engine.train($('#trainInput').value, $('#trainMeter').value, { difficulty: $('#trainLevel').value });
  if (!r.ok) {
    $('#trainResult').innerHTML = `<div class="panel"><div class="note warn">${esc(r.error)}${r.reason ? '<br>' + esc(r.reason) : ''}</div></div>`;
    return;
  }
  $('#trainResult').innerHTML = `<div class="panel">
    <div class="verdict">
      <span class="name">${r.correct ? 'صحيح' : 'غير صحيح'}</span>
      <span class="badge ${r.correct ? 'sound' : 'broken'}">${pct(r.achievedScore)} / المطلوب ${pct(r.requiredScore)}</span>
    </div>
    ${r.expectedPattern ? `<p class="muted" style="margin:12px 0 4px">النمط المتوقَّع</p><div class="mono">${esc(r.expectedPattern)}</div>` : ''}
    <p class="muted" style="margin:10px 0 4px">النمط الفعلي</p><div class="mono">${esc(r.actualPattern)}</div>
    ${r.feedback.map((f) => `<div class="note ${f.kind === 'success' ? '' : 'warn'}">${esc(f.text)}</div>`).join('')}
  </div>`;
});

/* ---------------- البحور ---------------- */
$('#metersTable').innerHTML = `
  <tr><th>البحر</th><th>التفعيلات (المصدر)</th><th>النمط</th><th>مقاطع</th><th>الحالة</th></tr>
  ${engine.listMeters().map((m) => `<tr class="${m.enabled ? '' : 'bad'}">
    <td>${esc(m.name)}${m.aliases.length ? `<br><small class="muted">${esc(m.aliases.join('، '))}</small>` : ''}</td>
    <td>${esc(m.sourceQuote)}</td>
    <td class="pat">${esc(m.pattern) || '—'}</td>
    <td>${m.syllableCount || '—'}</td>
    <td>${m.enabled ? esc(m.status) : `<strong>معطَّل</strong><br><small class="muted">${esc(m.blockedBy || '')}</small>`}</td>
  </tr>`).join('')}
  ${engine.registry.notInSource.map((n) => `<tr class="bad"><td>${esc(n.name)}</td><td colspan="4"><small>${esc(n.reason)}</small></td></tr>`).join('')}`;

/* ---------------- معلَّق ---------------- */
$('#openList').innerHTML = engine.openQuestions().map((q) => `<div class="note warn">
  <strong>${esc(q.area)}${q.name ? ' — ' + esc(q.name) : ''}</strong><br>
  ${esc(q.issue || '')}
  ${q.gaps ? '<ul style="margin:6px 0 0;padding-inline-start:18px">' + q.gaps.map((g) => `<li>${esc(g)}</li>`).join('') + '</ul>' : ''}
  ${q.resolvedBy ? `<br><em>ما يحسمه: ${esc(Array.isArray(q.resolvedBy) ? q.resolvedBy.join('؛ ') : q.resolvedBy)}</em>` : ''}
</div>`).join('');

/* ---------------- تشغيل أولي ---------------- */
if (/[?&]debug=1\b/.test(location.search)) $('#debug').checked = true;
$('#input').value = SAMPLES[0][1];
runAnalyze();
