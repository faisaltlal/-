/**
 * مُشغّل اختبارات صغير بلا اعتماديات — المشروع كله يعمل بـ node وحده.
 */

const suites = [];
let current = null;

export function describe(name, fn) {
  current = { name, tests: [] };
  suites.push(current);
  fn();
  current = null;
}

export function it(name, fn) {
  if (!current) throw new Error('it() خارج describe()');
  current.tests.push({ name, fn });
}

export function assert(cond, message) {
  if (!cond) throw new Error(message || 'التوقّع لم يتحقّق');
}

export function equal(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message ? message + '\n    ' : ''}المتوقَّع: ${e}\n    الواقع:   ${a}`);
  }
}

export function close(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message ? message + ' — ' : ''}المتوقَّع ${expected} ±${tolerance}، والواقع ${actual}`);
  }
}

export function atLeast(actual, floor, message) {
  if (!(actual >= floor)) {
    throw new Error(`${message ? message + ' — ' : ''}المتوقَّع ≥ ${floor}، والواقع ${actual}`);
  }
}

export async function runAll() {
  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const suite of suites) {
    const results = [];
    for (const t of suite.tests) {
      try {
        await t.fn();
        pass++;
        results.push(`  ✓ ${t.name}`);
      } catch (err) {
        fail++;
        results.push(`  ✗ ${t.name}\n    ${String(err.message).replace(/\n/g, '\n    ')}`);
        failures.push(`${suite.name} › ${t.name}`);
      }
    }
    console.log(`\n${suite.name}`);
    console.log(results.join('\n'));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`المجموع: ${pass + fail} — ناجح ${pass} — فاشل ${fail}`);
  if (fail) {
    console.log(`\nالفاشل:\n${failures.map((f) => '  • ' + f).join('\n')}`);
  }
  console.log(`نسبة النجاح: ${(((pass) / (pass + fail || 1)) * 100).toFixed(1)}%`);
  return { pass, fail, total: pass + fail };
}
