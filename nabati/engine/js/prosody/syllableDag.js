/**
 * SyllableParser — بناء المقاطع.
 *
 * لا نُخرج سلسلة مقاطع واحدة، بل **مخطّطًا موجّهًا** (DAG) عقده مواضع
 * الوحدات وحوافه المقاطع الممكنة. السبب:
 *
 *   نصّ مشكول  → للمخطّط مسار واحد، فالتقطيع قاطع.
 *   نصّ مجرّد   → للمخطّط مسارات، وكلها قراءات مشروعة لغويًا.
 *
 * وهكذا يعمل النوعان بمسار كود واحد: المطابقة تسأل «هل في المخطّط
 * مسار يوافق هذا الوزن؟» بدل أن نخمّن تشكيلًا ثم نقيس عليه.
 *
 * بنية المقطع العربي (لا رابع لها):
 *   CV    صامت + حركة قصيرة            → قصير (S)
 *   CVV   صامت + حركة طويلة            → طويل (L)
 *   CVC   صامت + قصيرة + ساكن          → طويل (L)
 *   CVVC  صامت + طويلة + ساكن          → مفرط (X) — آخر الشطر فقط
 */

/** @typedef {{from:number,to:number,weight:'S'|'L'|'X',meta:object}} Edge */

const SHORT = 'S';
const LONG = 'L';
const OVERLONG = 'X';

function nucleusOptions(unit) {
  const v = unit.vowel;
  if (v.known) {
    if (v.length === 'none') return [];
    if (v.length === 'long') return [{ kind: 'long', quality: v.quality }];
    return [{ kind: 'short', quality: v.quality }];
  }
  const out = [];
  if (v.options.includes('short')) out.push({ kind: 'short', quality: null, assumed: true });
  if (v.options.includes('long')) {
    out.push({ kind: 'long', quality: v.longQuality || null, assumed: true, suppressesNext: true });
  }
  return out;
}

/** هل تصلح هذه الوحدة ساكنًا يغلق المقطع؟ */
function canBeCoda(unit) {
  const v = unit.vowel;
  if (v.known) return v.length === 'none';
  return v.options.includes('none');
}

/**
 * هل يجوز أن يغلق هذا الساكن مقطعًا فاتحته في كلمة أخرى؟
 *
 * الأصل أن الساكن يبقى في كلمته، لأن كل كلمة عربية تبدأ بمتحرك.
 * الاستثناء الوحيد: كلمة سقطت همزة وصلها فبدأت بساكن — وهذا هو
 * الوصل نفسه: «في البيت» تُنطق فِلْ‑بَيْت، فلام «أل» تغلق مقطع «في».
 * وهذا الساكن لا يكون إلا معلومَ السكون، لأننا لا نُسقط همزة وصل
 * إلا حين نتيقّن منها.
 */
function codaAllowed(onset, coda, isWordInitial) {
  if (coda.word === onset.word) return true;
  return isWordInitial && coda.vowel.known && coda.vowel.length === 'none';
}

/**
 * @param {object[]} units
 * @param {{ ishbaa?: boolean }} [options]
 * @returns {{ edges: Edge[][], size:number, assumedVocalization:boolean }}
 */
export function buildSyllableDag(units, options = {}) {
  const ishbaa = options.ishbaa !== false;
  const n = units.length;
  const edges = Array.from({ length: n + 1 }, () => []);
  let assumed = false;

  const add = (from, to, weight, meta) => {
    edges[from].push({ from, to, weight, meta });
  };

  // أول وحدة في كل كلمة — يلزم لمعرفة الساكن الذي سقطت همزة وصله.
  const startsWord = units.map((u, k) => k === 0 || units[k - 1].word !== u.word);

  for (let i = 0; i < n; i++) {
    const onset = units[i];
    for (const nuc of nucleusOptions(onset)) {
      if (nuc.assumed) assumed = true;
      // الواو/الياء التي احتُسبت حرف مدّ لا تعود وحدةً مستقلة.
      const afterNucleus =
        nuc.kind === 'long' && onset.suppressNextIfLong && nuc.suppressesNext
          ? i + 2
          : i + 1;
      if (afterNucleus > n) continue;

      const base = {
        onsetIndex: i,
        onset: onset.c,
        nucleus: nuc.kind,
        quality: nuc.quality,
        assumed: !!nuc.assumed,
        consumed: [i],
      };

      // مقطع مفتوح
      add(i, afterNucleus, nuc.kind === 'long' ? LONG : SHORT, { ...base, shape: nuc.kind === 'long' ? 'CVV' : 'CV' });

      // مقطع مغلق: الساكن التالي يغلقه، بشرط أن يكون من الكلمة نفسها.
      const coda = units[afterNucleus];
      if (coda && canBeCoda(coda) && codaAllowed(onset, coda, startsWord[afterNucleus])) {
        const withCoda = {
          ...base,
          coda: coda.c,
          consumed: [i, afterNucleus],
          codaAssumed: !coda.vowel.known,
        };
        if (!coda.vowel.known) assumed = true;

        if (nuc.kind === 'short') {
          add(i, afterNucleus + 1, LONG, { ...withCoda, shape: 'CVC' });
        } else {
          const atLineEnd = afterNucleus + 1 === n;
          if (atLineEnd) {
            // مقطع مفرط الطول لا يقع إلا في آخر الشطر.
            add(i, afterNucleus + 1, OVERLONG, { ...withCoda, shape: 'CVVC' });
          }
          // التقاء الساكنين: حرف المدّ يسقط في النطق فيقصر المقطع.
          // (في البيت ← فِلْبَيْت). قاعدة عروضية مقرَّرة لا تخمين.
          add(i, afterNucleus + 1, LONG, {
            ...withCoda,
            shape: 'CVC',
            shortenedLongVowel: true,
            rule: 'التقاء الساكنين',
          });
        }
      }
    }
  }

  // الإشباع: آخر الشطر لا يقع عليه متحرك، فتُشبَع حركة الروي فيصير
  // المقطع طويلًا. نضيفها قراءةً موازية بلا كلفة بدل أن نفرضها، لأن
  // بعض الأضرب تنتهي بمقطع قصير في التدوين المصدري.
  if (ishbaa) {
    const terminalShort = [];
    for (const group of edges) {
      for (const e of group) {
        if (e.to === n && e.weight === SHORT) terminalShort.push(e);
      }
    }
    for (const e of terminalShort) {
      add(e.from, n, LONG, { ...e.meta, ishbaa: true, rule: 'إشباع حركة الروي' });
    }
  }

  return { edges, size: n, assumedVocalization: assumed };
}

/** كل المسارات الكاملة عبر المخطّط، بسقف يمنع الانفجار. */
export function enumeratePaths(dag, limit = 2000) {
  const results = [];
  let truncated = false;

  const walk = (node, acc) => {
    if (results.length >= limit) { truncated = true; return; }
    if (node === dag.size) { results.push([...acc]); return; }
    for (const e of dag.edges[node]) {
      acc.push(e);
      walk(e.to, acc);
      acc.pop();
      if (results.length >= limit) { truncated = true; return; }
    }
  };

  walk(0, []);
  return { paths: results, truncated };
}

/**
 * التقطيع الحرّ: يُستعمل حين يكفي النصّ نفسه لتحديد المقاطع، أي حين
 * لا يوجد في المخطّط إلا قراءة واحدة (بعد طيّ فروق الإشباع).
 */
export function freeSyllabify(dag) {
  const { paths, truncated } = enumeratePaths(dag, 64);
  if (truncated || paths.length === 0) {
    return { certain: false, syllables: [], pathCount: truncated ? '64+' : 0 };
  }
  // نطوي الفروق التي لا تغيّر النمط، فإن بقي نمط واحد فالتقطيع قاطع.
  const patterns = new Set(paths.map((p) => p.map((e) => e.weight).join('')));
  const preferred = paths.slice().sort((a, b) => {
    const ish = (p) => (p[p.length - 1]?.meta.ishbaa ? 0 : 1);
    return ish(a) - ish(b) || a.length - b.length;
  })[0];
  return {
    certain: patterns.size === 1,
    variants: patterns.size,
    syllables: preferred.map(edgeToSyllable),
    pathCount: paths.length,
  };
}

export function edgeToSyllable(e) {
  return {
    weight: e.weight,
    shape: e.meta.shape,
    onset: e.meta.onset,
    nucleus: e.meta.nucleus,
    coda: e.meta.coda || null,
    assumed: !!e.meta.assumed || !!e.meta.codaAssumed,
    rule: e.meta.rule || null,
    ishbaa: !!e.meta.ishbaa,
    units: e.meta.consumed,
  };
}

export { SHORT, LONG, OVERLONG };
