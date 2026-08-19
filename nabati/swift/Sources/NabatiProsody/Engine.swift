import Foundation

/// نقطة الدخول العامة للحزمة.
///
///     let engine = try ProsodyEngine()
///     let result = engine.analyze("مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ")
///     print(result.bestMeter?.name ?? "—", result.verdict)

public struct SyllableInfo: Sendable {
    public let weight: SyllableWeight
    public let shape: String
    public let rule: String?
    public let ishbaa: Bool
    public let assumed: Bool
}

public struct TafilaResult: Sendable {
    public let footIndex: Int
    public let hemistich: Int
    public let tafila: String
    public let realized: String?
    public let variation: String
    public let variationKind: String
    public let expected: String
    public let actual: String
    public let sound: Bool
    public let words: [String]
}

public struct BestMeter: Sendable {
    public let id: String
    public let name: String
    public let aliases: [String]
    public let score: Double
    public let confidence: Double
    public let verdict: String
    public let repeatCount: Int
    public let status: String?
}

public struct Alternative: Sendable {
    public let id: String
    public let name: String
    public let score: Double
    public let confidence: Double
    public let verdict: String
}

public struct Ambiguity: Sendable {
    public let tiedWith: [Alternative]
    public let reason: String
    public let advice: String
}

public struct AnalysisResult: Sendable {
    public let input: String
    public let normalized: String
    public let removed: [RemovedItem]
    public let prosodic: String
    public let hasDiacritics: Bool
    public let vocalizationCoverage: Double
    public let assumedVocalization: Bool
    public let syllables: [SyllableInfo]
    public let internalPattern: String
    public let numericPattern: String?
    public let numericPatterns: [String: DigitalPattern.Encoded]
    public let bestMeter: BestMeter?
    public let verdict: String
    public let tafaeel: [TafilaResult]
    public let brokenFeet: [BrokenFoot]
    public let alternatives: [Alternative]
    public let ambiguity: Ambiguity?
    public let explanation: String
}

public struct PoemLine: Sendable {
    public let index: Int
    public let input: String
    public let meter: String?
    public let meterId: String?
    public let score: Double
    public let verdict: String
}

public struct MeterShare: Sendable {
    public let id: String
    public let name: String
    public let lines: Int
    public let share: Double
    public let averageScore: Double
}

public struct PoemResult: Sendable {
    public let lineCount: Int
    public let distribution: [MeterShare]
    public let dominantMeter: MeterShare?
    public let consistency: Double
    public let unclear: Int
    public let outliers: [(index: Int, input: String, reason: String)]
    public let lines: [PoemLine]
}

public struct ProsodyEngine: Sendable {
    public let data: EngineData
    public let registry: MeterRegistry
    public let scorer: Scorer
    public let encoder: DigitalPattern
    let phonemizer: Phonemizer

    public init(data: EngineData? = nil) throws {
        let d = try data ?? EngineData.bundled()
        self.data = d
        self.registry = MeterRegistry(data: d)
        self.scorer = Scorer(config: d.scoring)
        self.encoder = DigitalPattern(schemes: d.encodings, defaultScheme: d.defaultScheme)
        self.phonemizer = Phonemizer(lexicon: d.lexicon)
    }

    // MARK: مراحل مكشوفة للاختبار المنفصل

    public func syllabify(_ text: String) -> (units: [PhonUnit], dag: SyllableDag,
                                              free: (certain: Bool, syllables: [SyllableEdge], pathCount: Int)) {
        let norm = TextNormalizer.normalize(text)
        let units = phonemizer.phonemize(words: norm.words).units
        let dag = SyllableParser.buildDag(units)
        return (units, dag, SyllableParser.freeSyllabify(dag))
    }

    public func matchPattern(_ pattern: [SyllableWeight], meter: String, repeatCount: Int = 1) throws -> MeterMatch {
        guard let m = registry.find(meter) else { throw EngineError.unknownMeter(meter) }
        guard let r = MeterMatcher.match(dag: SyllableDag.fromPattern(pattern), meter: m,
                                         scorer: scorer, repeatCount: repeatCount) else {
            throw EngineError.unknownMeter(meter)
        }
        return r
    }

    public func rankPattern(_ pattern: [SyllableWeight], repeats: [Int] = [1]) -> [MeterMatch] {
        MeterMatcher.rank(dag: SyllableDag.fromPattern(pattern), registry: registry,
                          scorer: scorer, repeats: repeats)
    }

    // MARK: التحليل

    public func analyze(_ input: String) -> AnalysisResult {
        // الفاصل الصريح يخبرنا بعدد الأشطر، فنطابق نمط البحر مكرَّرًا
        // بعددها. وعند غيابه نجرّب شطرًا واحدًا وبيتًا كاملًا ونترك الوزن
        // يحسم، بدل تخمين موضع القسمة.
        let split = TextNormalizer.splitHemistichs(input)
        let repeats = (split.explicit && split.parts.count >= 2) ? [split.parts.count] : [1, 2]

        let norm = TextNormalizer.normalize(input)
        let ph = phonemizer.phonemize(words: norm.words)
        let dag = SyllableParser.buildDag(ph.units)
        let free = SyllableParser.freeSyllabify(dag)
        let ranking = MeterMatcher.rank(dag: dag, registry: registry, scorer: scorer, repeats: repeats)

        let best = ranking.first
        let tie = scorer.config.uncertainty.tieDelta
        let tied = best.map { b in ranking.dropFirst().filter { b.score - $0.score <= tie } } ?? []
        let ambiguous = !tied.isEmpty

        // تقطيع البيت هو القراءة التي اختارها البحر الفائز. لا نستعمل
        // التقطيع الحرّ إلا حين لا يوجد بحر فائز أصلًا، لأن النصّ غير
        // المشكول لا قراءة حرّة واحدة له.
        let chosenEdges: [SyllableEdge] = best.map { m in
            m.feet.flatMap { $0.ops.compactMap { $0.edge } }
        } ?? []
        let displayEdges = chosenEdges.isEmpty ? free.syllables : chosenEdges
        let weights = displayEdges.map { $0.weight }
        let shapes = displayEdges.map { $0.shape }

        var confidence = best?.confidence ?? 0
        if ambiguous { confidence = round6(confidence * (1 - scorer.config.uncertainty.ambiguityPenalty)) }

        let alternatives = ranking.dropFirst()
            .prefix(scorer.config.ranking.maxAlternatives)
            .filter { $0.score >= scorer.config.ranking.minScoreToList }
            .map { Alternative(id: $0.meterId, name: $0.name, score: $0.score,
                               confidence: $0.confidence, verdict: $0.verdict) }

        let tafaeel: [TafilaResult] = (best?.feet ?? []).map { c in
            let words = Set(c.unitSpan.compactMap { i -> Int? in
                i < ph.units.count ? ph.units[i].word : nil
            }).sorted().compactMap { i -> String? in
                i < norm.words.count ? norm.words[i] : nil
            }
            return TafilaResult(
                footIndex: c.footIndex, hemistich: c.hemistich, tafila: c.tafila,
                realized: c.realized, variation: c.variantName, variationKind: c.variantKind,
                expected: c.expected.map { $0.rawValue }.joined(),
                actual: c.actual.map { $0.rawValue }.joined(),
                sound: c.alignCost < scorer.config.brokenFoot.minCostToReport,
                words: words
            )
        }

        return AnalysisResult(
            input: input,
            normalized: norm.text,
            removed: norm.removed,
            prosodic: prosodicSpelling(ph.units),
            hasDiacritics: norm.hasDiacritics,
            vocalizationCoverage: norm.vocalizationCoverage,
            assumedVocalization: dag.assumedVocalization,
            syllables: displayEdges.map {
                SyllableInfo(weight: $0.weight, shape: $0.shape, rule: $0.rule,
                             ishbaa: $0.ishbaa, assumed: $0.assumed)
            },
            internalPattern: weights.map { $0.rawValue }.joined(),
            numericPattern: (try? encoder.encode(weights, shapes: shapes))?.value,
            numericPatterns: encoder.encodeAll(weights, shapes: shapes),
            bestMeter: best.map {
                BestMeter(id: $0.meterId, name: $0.name, aliases: $0.aliases, score: $0.score,
                          confidence: confidence, verdict: $0.verdict,
                          repeatCount: $0.repeatCount, status: $0.status)
            },
            verdict: best?.verdict ?? "unrecognized",
            tafaeel: tafaeel,
            brokenFeet: best?.brokenFeet ?? [],
            alternatives: Array(alternatives),
            ambiguity: ambiguous ? Ambiguity(
                tiedWith: tied.map { Alternative(id: $0.meterId, name: $0.name, score: $0.score,
                                                 confidence: $0.confidence, verdict: $0.verdict) },
                reason: dag.assumedVocalization
                    ? "النصّ غير مشكول، فيقبل أكثر من تقطيع، وكل تقطيع يوافق بحرًا."
                    : "أكثر من بحر يوافق هذا النمط المقطعي بالدرجة نفسها.",
                advice: dag.assumedVocalization
                    ? "اكتب البيت مشكولًا ليحسم المحرك الوزن."
                    : "حلّل القصيدة كاملة ليترجّح الغالب."
            ) : nil,
            explanation: explain(best)
        )
    }

    public func analyzePoem(_ input: String) -> PoemResult {
        let lines = TextNormalizer.splitLines(input)
        let results = lines.map { analyze($0) }

        var tally: [String: (name: String, lines: Int, sum: Double)] = [:]
        for r in results {
            guard let b = r.bestMeter else { continue }
            var cur = tally[b.id] ?? (b.name, 0, 0)
            cur.lines += 1
            cur.sum += b.score
            tally[b.id] = cur
        }
        let distribution = tally.map { (id, v) in
            MeterShare(id: id, name: v.name, lines: v.lines,
                       share: round6(Double(v.lines) / Double(max(results.count, 1))),
                       averageScore: round6(v.sum / Double(v.lines)))
        }.sorted {
            let a = tally[$0.id]!.sum, b = tally[$1.id]!.sum
            return a != b ? a > b : $0.id < $1.id
        }
        let dominant = distribution.first

        var outliers: [(index: Int, input: String, reason: String)] = []
        for (i, r) in results.enumerated() {
            guard let b = r.bestMeter else {
                outliers.append((i, r.input, "لم يوافق أي بحر")); continue
            }
            if let d = dominant, b.id != d.id {
                outliers.append((i, r.input, "تصدّره \(b.name) لا \(d.name)"))
            } else if r.verdict == "broken" || r.verdict == "unrecognized" {
                outliers.append((i, r.input, "على \(b.name) لكنه مكسور"))
            }
        }

        return PoemResult(
            lineCount: results.count,
            distribution: distribution,
            dominantMeter: dominant,
            consistency: dominant.map { round6(Double($0.lines) / Double(max(results.count, 1))) } ?? 0,
            unclear: results.filter { $0.bestMeter == nil || $0.verdict == "unrecognized" }.count,
            outliers: outliers,
            lines: results.enumerated().map { (i, r) in
                PoemLine(index: i, input: r.input, meter: r.bestMeter?.name,
                         meterId: r.bestMeter?.id, score: r.bestMeter?.score ?? 0, verdict: r.verdict)
            }
        )
    }

    // MARK: أدوات

    /// الكتابة العروضية — النصّ كما يُنطق.
    func prosodicSpelling(_ units: [PhonUnit]) -> String {
        let mark: [String: String] = ["a": "\u{064E}", "i": "\u{0650}", "u": "\u{064F}"]
        let mater: [String: String] = ["a": "ا", "i": "ي", "u": "و"]
        var out = ""
        var word = -1
        for u in units {
            if u.word != word { if word != -1 { out += " " }; word = u.word }
            out.unicodeScalars.append(u.consonant)
            switch u.vowel {
            case .known(let len, let q):
                switch len {
                case .none: out += "\u{0652}"
                case .short: out += mark[q ?? ""] ?? ""
                case .long: out += (mark[q ?? ""] ?? "") + (mater[q ?? ""] ?? "")
                }
            case .unknown: out += "؟"
            }
        }
        return out
    }

    private func explain(_ best: MeterMatch?) -> String {
        guard let b = best else {
            return "لم يوافق البيت أي بحر في القاعدة بدرجة تُعتدّ."
        }
        let p = Int((b.score * 100).rounded())
        switch b.verdict {
        case "sound": return "طابق البيت تفعيلات \(b.name) كاملةً بدرجة \(p)٪."
        case "acceptable": return "البيت موزون على \(b.name) بدرجة \(p)٪ مع رخص جائزة."
        case "broken":
            if let f = b.brokenFeet.first {
                return "أقرب البحور \(b.name) بدرجة \(p)٪. موضع الخلل التفعيلة \(f.footIndex + 1) (\(f.tafila)): البحر يطلب \(f.expected) والبيت أعطى \(f.actual)."
            }
            return "أقرب البحور \(b.name) بدرجة \(p)٪ والخلل موزّع."
        default: return "أعلى درجة بلغها البيت \(p)٪ على \(b.name)، وهي دون عتبة القبول."
        }
    }

    /// كل ما لم يُحسم — البند 26.
    public func openQuestions() -> [String] {
        var out: [String] = []
        for t in data.tafaeel where t.status == "NEEDS_VALIDATION" {
            out.append("tafila: \(t.plain) — تعريفها غير مثبت")
        }
        for m in registry.meters where m.status == "NEEDS_VALIDATION" {
            out.append("meter: \(m.name) — \(m.enabled ? "مفعَّل مع تحفّظ" : "معطَّل")")
        }
        for s in data.encodings where s.status == "NEEDS_VALIDATION" {
            out.append("encoding: \(s.id) — غير مثبت")
        }
        for n in registry.notInSource {
            out.append("missing_meter: \(n.name) — \(n.reason)")
        }
        return out
    }
}
