import Foundation

/// السجلّ والمطابقة والدرجة.
///
/// إضافة بحر جديد لا تمسّ هذا الملف: البحور والصور والمعاملات كلها بيانات.

// MARK: - السجلّ

public struct Foot: Sendable {
    public let index: Int
    public let tafilaId: String
    public let plain: String
    public let salim: [SyllableWeight]
    public let variants: [Variation]
}

public struct Meter: Sendable {
    public let id: String
    public let name: String
    public let aliases: [String]
    public let enabled: Bool
    public let status: String?
    public let sourceQuote: String?
    public let note: String?
    public let feet: [Foot]
    public let pattern: [SyllableWeight]
    public let tafaeelNames: [String]
}

public struct IntegrityProblem: Sendable {
    public let kind: String
    public let detail: String
}

public struct MeterRegistry: Sendable {
    public let meters: [Meter]
    public let enabled: [Meter]
    public let problems: [IntegrityProblem]
    public let notInSource: [NotInSource]
    private let byId: [String: Meter]

    public init(data: EngineData) {
        var problems: [IntegrityProblem] = []
        let tafilaById = Dictionary(uniqueKeysWithValues: data.tafaeel.map { ($0.id, $0) })

        func weights(_ raw: [String]) -> [SyllableWeight] {
            raw.compactMap { SyllableWeight(rawValue: $0) }
        }

        func variantsOf(_ id: String) -> [Variation] {
            if let v = data.variations[id] { return v }
            problems.append(.init(kind: "missing_variations", detail: id))
            guard let t = tafilaById[id] else { return [] }
            return [Variation(id: "salim", name: "سالم", result: t.vocalized,
                              syllables: t.syllables, kind: "salim", scope: "any", severity: 1)]
        }

        var built: [Meter] = []
        for m in data.meters {
            var feet: [Foot] = []
            var pattern: [SyllableWeight] = []
            var names: [String] = []
            if let ids = m.feet {
                for (i, fid) in ids.enumerated() {
                    guard let t = tafilaById[fid] else {
                        problems.append(.init(kind: "unknown_tafila", detail: "\(m.id) → \(fid)"))
                        continue
                    }
                    feet.append(Foot(index: i, tafilaId: t.id, plain: t.plain,
                                     salim: weights(t.syllables), variants: variantsOf(t.id)))
                    pattern.append(contentsOf: weights(t.syllables))
                    names.append(t.plain)
                }
                if let declared = m.expectedSyllableCount, declared != pattern.count {
                    problems.append(.init(kind: "syllable_count_mismatch",
                                          detail: "\(m.id): declared \(declared), derived \(pattern.count)"))
                }
            }
            built.append(Meter(
                id: m.id, name: m.name, aliases: m.aliases ?? [],
                enabled: (m.enabled ?? true) && !pattern.isEmpty,
                status: m.status, sourceQuote: m.sourceQuote, note: m.note,
                feet: feet, pattern: pattern, tafaeelNames: names
            ))
        }

        // النمط المقطعي لكل تفعيلة يجب أن يوافق نمطها الحرفي الخليلي.
        for t in data.tafaeel {
            guard let declared = t.khalilLetters else { continue }
            let derived = t.syllables.map { $0 == "S" ? "1" : ($0 == "X" ? "100" : "10") }.joined()
            if derived != declared {
                problems.append(.init(kind: "tafila_pattern_mismatch",
                                      detail: "\(t.id): \(derived) ≠ \(declared)"))
            }
        }

        self.meters = built
        self.enabled = built.filter { $0.enabled }
        self.problems = problems
        self.notInSource = data.notInSource
        self.byId = Dictionary(uniqueKeysWithValues: built.map { ($0.id, $0) })
    }

    public func find(_ nameOrId: String) -> Meter? {
        if let m = byId[nameOrId] { return m }
        let needle = PureText.trim(nameOrId)
        return meters.first { $0.name == needle || $0.aliases.contains(needle) }
    }
}

// MARK: - الدرجة

public struct Scorer: Sendable {
    public let config: ScoringConfig

    public init(config: ScoringConfig) { self.config = config }

    public func substitutionCost(_ actual: SyllableWeight, _ expected: SyllableWeight) -> Double {
        if actual == expected { return 0 }
        let pair = Set([actual, expected])
        if pair == Set([SyllableWeight.L, .X]) { return config.weights.overlongMismatch }
        return config.weights.substitution
    }

    public func variationCost(_ v: Variation, isArudDarb: Bool) -> Double {
        let base = config.weights.variationKind[v.kind] ?? config.weights.variationKind["zihaf"] ?? 0
        let sev = config.weights.severityMultiplier[String(v.severity ?? 1)] ?? 1
        var cost = base * sev
        if v.scope == "arud_darb" && !isArudDarb { cost += config.weights.scopeViolation }
        return cost
    }

    public func positionMultiplier(isFirst: Bool, isArudDarb: Bool) -> Double {
        if isArudDarb { return config.weights.position.arudDarb }
        if isFirst { return config.weights.position.first }
        return config.weights.position.hashw
    }

    public func finalize(cost: Double, meterSyllables: Int, assumedVocalization: Bool)
        -> (score: Double, confidence: Double, normalizer: Double) {
        let n = max(Double(meterSyllables), config.normalizer.floor)
        let normalizer = n * config.normalizer.perSyllableCost
        let score = min(1, max(0, 1 - cost / normalizer))
        var confidence = score
        if assumedVocalization { confidence *= 1 - config.uncertainty.assumedVocalizationPenalty }
        return (round6(score), round6(confidence), round6(normalizer))
    }

    /// الحالات A/B/C/D. تفعيلة لم توافق أي صورة مأذون فيها كسرٌ بالتعريف،
    /// مهما ارتفعت الدرجة؛ والزحاف ليس منها لأن كلفته ليست كلفة محاذاة.
    public func classify(score: Double, brokenFeet: Int, totalFeet: Int) -> String {
        let t = config.thresholds
        if totalFeet > 0 && Double(brokenFeet) / Double(totalFeet) > t.maxBrokenFootRatio {
            return "unrecognized"
        }
        let byScore: String = score >= t.sound ? "sound"
            : score >= t.acceptable ? "acceptable"
            : score >= t.broken ? "broken" : "unrecognized"
        if brokenFeet > 0 && (byScore == "sound" || byScore == "acceptable") { return "broken" }
        return byScore
    }
}

func round6(_ x: Double) -> Double { (x * 1_000_000).rounded() / 1_000_000 }

// MARK: - مطابقة تفعيلة

public struct AlignOp: Sendable {
    public let op: String          // match | substitute | insert | delete
    public let expected: SyllableWeight?
    public let actual: SyllableWeight?
    /// المقطع الفعلي من المخطّط. يُحمَل هنا لأن التحليل يعيد بناء تقطيع
    /// البيت من القراءة التي اختارها البحر الفائز، لا من تقطيع حرّ —
    /// والنصّ غير المشكول لا تقطيع حرّ له أصلًا.
    public let edge: SyllableEdge?
}

struct FootMatch {
    let cost: Double
    let ops: [AlignOp]
    let actual: [SyllableWeight]
}

enum FootMatcher {
    /// محاذاة بأقل كلفة بين مسارات المخطّط ونمط صورة واحدة.
    static func match(dag: SyllableDag, from: Int, pattern: [SyllableWeight], scorer: Scorer) -> [Int: FootMatch] {
        let n = dag.size
        let P = pattern.count
        let w = scorer.config.weights
        func key(_ u: Int, _ p: Int) -> Int { u * (P + 1) + p }

        var dist: [Int: Double] = [key(from, 0): 0]
        var back: [Int: (prev: Int, op: AlignOp)] = [:]

        func relax(_ u: Int, _ p: Int, _ cost: Double, _ prevKey: Int, _ op: AlignOp) {
            let k = key(u, p)
            if let cur = dist[k], cost >= cur - 1e-12 { return }
            dist[k] = cost
            back[k] = (prevKey, op)
        }

        // الحواف تتقدّم بموضع الوحدات، والنقص بموضع النمط، فترتيب
        // (u تصاعديًا ثم p تصاعديًا) كافٍ بلا طابور أولوية.
        for u in from...n {
            for p in 0...P {
                let k = key(u, p)
                guard let c = dist[k] else { continue }
                if p < P {
                    relax(u, p + 1, c + w.deletion, k,
                          AlignOp(op: "delete", expected: pattern[p], actual: nil, edge: nil))
                }
                for e in dag.edges[u] {
                    if p < P {
                        let sc = scorer.substitutionCost(e.weight, pattern[p])
                        relax(e.to, p + 1, c + sc, k,
                              AlignOp(op: sc == 0 ? "match" : "substitute",
                                      expected: pattern[p], actual: e.weight, edge: e))
                    }
                    relax(e.to, p, c + w.insertion, k,
                          AlignOp(op: "insert", expected: nil, actual: e.weight, edge: e))
                }
            }
        }

        var results: [Int: FootMatch] = [:]
        for u in from...n {
            guard let c = dist[key(u, P)] else { continue }
            var ops: [AlignOp] = []
            var cur = key(u, P)
            let start = key(from, 0)
            while cur != start, let bp = back[cur] {
                ops.append(bp.op)
                cur = bp.prev
            }
            ops.reverse()
            let actual = ops.compactMap { $0.actual }
            results[u] = FootMatch(cost: c, ops: ops, actual: actual)
        }
        return results
    }

    /// أقل عدد مقاطع يستهلك ما بقي من الوحدات، لتسعير ذيل البيت.
    static func minSyllablesToEnd(_ dag: SyllableDag) -> [Double] {
        var best = [Double](repeating: .infinity, count: dag.size + 1)
        best[dag.size] = 0
        guard dag.size > 0 else { return best }
        for u in stride(from: dag.size - 1, through: 0, by: -1) {
            for e in dag.edges[u] where best[e.to] + 1 < best[u] {
                best[u] = best[e.to] + 1
            }
        }
        return best
    }
}

// MARK: - مطابقة البحر

public struct ChosenFoot: Sendable {
    public let footIndex: Int
    public let hemistich: Int
    public let tafila: String
    public let variantId: String
    public let variantName: String
    public let realized: String?
    public let variantKind: String
    public let expected: [SyllableWeight]
    public let actual: [SyllableWeight]
    public let unitSpan: Range<Int>
    public let alignCost: Double
    public let ops: [AlignOp]
}

public struct BrokenFoot: Sendable {
    public let footIndex: Int
    public let tafila: String
    public let expected: String
    public let actual: String
    public let cost: Double
    public let issues: [String]
}

public struct MeterMatch: Sendable {
    public let meterId: String
    public let name: String
    public let aliases: [String]
    public let status: String?
    public let repeatCount: Int
    public let score: Double
    public let confidence: Double
    public let cost: Double
    public let normalizer: Double
    public let verdict: String
    public let feet: [ChosenFoot]
    public let brokenFeet: [BrokenFoot]
    public let leftoverSyllables: Double
    public let assumedVocalization: Bool
}

public enum MeterMatcher {
    private struct State { let cost: Double; let chosen: [ChosenFoot] }

    public static func match(dag: SyllableDag, meter: Meter, scorer: Scorer, repeatCount: Int = 1) -> MeterMatch? {
        struct ExpandedFoot {
            let foot: Foot
            let hemistich: Int
            let isFirst: Bool
            let isArudDarb: Bool
        }
        var expanded: [ExpandedFoot] = []
        for r in 0..<repeatCount {
            for (i, f) in meter.feet.enumerated() {
                expanded.append(ExpandedFoot(foot: f, hemistich: r, isFirst: i == 0,
                                             isArudDarb: i == meter.feet.count - 1))
            }
        }
        guard !expanded.isEmpty else { return nil }

        let tail = FootMatcher.minSyllablesToEnd(dag)
        var states: [Int: State] = [0: State(cost: 0, chosen: [])]

        for (fi, ef) in expanded.enumerated() {
            var next: [Int: State] = [:]
            let posMult = scorer.positionMultiplier(isFirst: ef.isFirst, isArudDarb: ef.isArudDarb)
            for (u, state) in states {
                for variant in ef.foot.variants {
                    let vCost = scorer.variationCost(variant, isArudDarb: ef.isArudDarb)
                    let pattern = variant.syllables.compactMap { SyllableWeight(rawValue: $0) }
                    let ends = FootMatcher.match(dag: dag, from: u, pattern: pattern, scorer: scorer)
                    for (end, res) in ends {
                        var cost = state.cost + (vCost + res.cost) * posMult
                        if end == u { cost += scorer.config.weights.unfilledFoot }
                        if let prev = next[end], prev.cost <= cost + 1e-12 { continue }
                        let chosen = ChosenFoot(
                            footIndex: fi, hemistich: ef.hemistich, tafila: ef.foot.plain,
                            variantId: variant.id, variantName: variant.name,
                            realized: variant.result, variantKind: variant.kind,
                            expected: pattern, actual: res.actual,
                            unitSpan: u..<max(u, end), alignCost: res.cost, ops: res.ops
                        )
                        next[end] = State(cost: cost, chosen: state.chosen + [chosen])
                    }
                }
            }
            states = next
            if states.isEmpty { return nil }
        }

        var best: (total: Double, state: State, leftover: Double)?
        for (u, state) in states {
            let leftover = tail[u]
            guard leftover.isFinite else { continue }
            let total = state.cost + leftover * scorer.config.weights.unconsumedSyllable
            if best == nil || total < best!.total - 1e-12 {
                best = (total, state, leftover)
            }
        }
        guard let b = best else { return nil }

        let meterSyllables = meter.pattern.count * repeatCount
        let f = scorer.finalize(cost: b.total, meterSyllables: meterSyllables,
                                assumedVocalization: dag.assumedVocalization)

        let threshold = scorer.config.brokenFoot.minCostToReport
        let broken = b.state.chosen
            .filter { $0.alignCost >= threshold || $0.actual.isEmpty }
            .map { c in
                BrokenFoot(
                    footIndex: c.footIndex, tafila: c.tafila,
                    expected: c.expected.map { $0.rawValue }.joined(),
                    actual: c.actual.map { $0.rawValue }.joined().isEmpty ? "—" : c.actual.map { $0.rawValue }.joined(),
                    cost: round6(c.alignCost),
                    issues: describe(c.ops)
                )
            }

        return MeterMatch(
            meterId: meter.id, name: meter.name, aliases: meter.aliases, status: meter.status,
            repeatCount: repeatCount, score: f.score, confidence: f.confidence,
            cost: round6(b.total), normalizer: f.normalizer,
            verdict: scorer.classify(score: f.score, brokenFeet: broken.count, totalFeet: b.state.chosen.count),
            feet: b.state.chosen, brokenFeet: broken,
            leftoverSyllables: b.leftover, assumedVocalization: dag.assumedVocalization
        )
    }

    private static func describe(_ ops: [AlignOp]) -> [String] {
        var out: [String] = []
        var pos = 0
        for o in ops {
            switch o.op {
            case "match": pos += 1
            case "substitute":
                out.append("المقطع \(pos + 1): البحر يطلب \(o.expected?.rawValue ?? "?") والبيت أعطى \(o.actual?.rawValue ?? "?")")
                pos += 1
            case "insert":
                out.append("مقطع \(o.actual?.rawValue ?? "?") زائد لا موضع له في التفعيلة")
            case "delete":
                out.append("المقطع \(pos + 1): البحر يطلب \(o.expected?.rawValue ?? "?") ولا مقابل له في البيت")
                pos += 1
            default: break
            }
        }
        return out
    }

    /// ترتيب لا إجابة واحدة.
    public static func rank(dag: SyllableDag, registry: MeterRegistry, scorer: Scorer,
                            repeats: [Int] = [1]) -> [MeterMatch] {
        var out: [MeterMatch] = []
        for meter in registry.enabled {
            var bestForMeter: MeterMatch?
            for r in repeats {
                guard let m = match(dag: dag, meter: meter, scorer: scorer, repeatCount: r) else { continue }
                if bestForMeter == nil || m.score > bestForMeter!.score { bestForMeter = m }
            }
            if let b = bestForMeter { out.append(b) }
        }
        out.sort { $0.score != $1.score ? $0.score > $1.score : $0.meterId < $1.meterId }
        return out
    }
}
