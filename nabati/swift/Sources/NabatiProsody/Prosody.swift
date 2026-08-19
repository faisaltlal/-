import Foundation

/// بناء المقاطع والنمط الرقمي.
///
/// المخرَج مخطّط موجّه لا سلسلة واحدة: النصّ المشكول يعطي مسارًا واحدًا،
/// والمجرّد يعطي مسارات، وكلها قراءات مشروعة. المطابقة تسأل «هل ثمّ مسار
/// يوافق هذا الوزن؟» بدل أن نخمّن تشكيلًا ثم نقيس عليه.

public enum SyllableWeight: String, Sendable, Codable {
    case S, L, X

    /// شكل المقطع الذي تمثّله هذه الكمّية افتراضًا.
    var defaultShape: String {
        switch self {
        case .S: return "CV"
        case .L: return "CVC"
        case .X: return "CVVC"
        }
    }
}

public struct SyllableEdge: Sendable {
    public let from: Int
    public let to: Int
    public let weight: SyllableWeight
    public let shape: String
    public let onset: Unicode.Scalar?
    public let coda: Unicode.Scalar?
    public let assumed: Bool
    public let rule: String?
    public let ishbaa: Bool
}

public struct SyllableDag: Sendable {
    public let edges: [[SyllableEdge]]
    public let size: Int
    public let assumedVocalization: Bool

    /// مخطّط بمسار واحد يمثّل نمطًا معطى — لاختبار المطابقة معزولة.
    public static func fromPattern(_ pattern: [SyllableWeight]) -> SyllableDag {
        var edges = [[SyllableEdge]](repeating: [], count: pattern.count + 1)
        for (i, w) in pattern.enumerated() {
            edges[i].append(SyllableEdge(
                from: i, to: i + 1, weight: w, shape: w.defaultShape,
                onset: nil, coda: nil, assumed: false, rule: nil, ishbaa: false
            ))
        }
        return SyllableDag(edges: edges, size: pattern.count, assumedVocalization: false)
    }
}

public enum SyllableParser {
    private struct Nucleus {
        let long: Bool
        let quality: String?
        let assumed: Bool
    }

    private static func nucleusOptions(_ u: PhonUnit) -> [Nucleus] {
        switch u.vowel {
        case .known(let len, let q):
            switch len {
            case .none: return []
            case .long: return [Nucleus(long: true, quality: q, assumed: false)]
            case .short: return [Nucleus(long: false, quality: q, assumed: false)]
            }
        case .unknown(let opts, let longQ):
            var out: [Nucleus] = []
            if opts.contains(.short) { out.append(Nucleus(long: false, quality: nil, assumed: true)) }
            if opts.contains(.long) { out.append(Nucleus(long: true, quality: longQ, assumed: true)) }
            return out
        }
    }

    private static func canBeCoda(_ u: PhonUnit) -> Bool { u.vowel.allows(.none) }

    /// الساكن يبقى في كلمته، إلا كلمةً سقطت همزة وصلها فبدأت بساكن —
    /// وهذا هو الوصل نفسه: «في البيت» تُنطق فِلْ‑بَيْت.
    private static func codaAllowed(onset: PhonUnit, coda: PhonUnit, startsWord: Bool) -> Bool {
        if coda.word == onset.word { return true }
        return startsWord && coda.vowel.isSilent
    }

    public static func buildDag(_ units: [PhonUnit], ishbaa: Bool = true) -> SyllableDag {
        let n = units.count
        var edges = [[SyllableEdge]](repeating: [], count: n + 1)
        var assumed = false

        var startsWord = [Bool](repeating: false, count: n)
        for k in 0..<n { startsWord[k] = (k == 0) || units[k - 1].word != units[k].word }

        for i in 0..<n {
            let onset = units[i]
            for nuc in nucleusOptions(onset) {
                if nuc.assumed { assumed = true }
                let afterNucleus = (nuc.long && onset.suppressNextIfLong) ? i + 2 : i + 1
                if afterNucleus > n { continue }

                edges[i].append(SyllableEdge(
                    from: i, to: afterNucleus, weight: nuc.long ? .L : .S,
                    shape: nuc.long ? "CVV" : "CV", onset: onset.consonant, coda: nil,
                    assumed: nuc.assumed, rule: nil, ishbaa: false
                ))

                guard afterNucleus < n else { continue }
                let coda = units[afterNucleus]
                guard canBeCoda(coda),
                      codaAllowed(onset: onset, coda: coda, startsWord: startsWord[afterNucleus])
                else { continue }

                let codaAssumed = nuc.assumed || !coda.vowel.isKnown
                if !coda.vowel.isKnown { assumed = true }

                if !nuc.long {
                    edges[i].append(SyllableEdge(
                        from: i, to: afterNucleus + 1, weight: .L, shape: "CVC",
                        onset: onset.consonant, coda: coda.consonant,
                        assumed: codaAssumed, rule: nil, ishbaa: false
                    ))
                } else {
                    if afterNucleus + 1 == n {
                        edges[i].append(SyllableEdge(
                            from: i, to: afterNucleus + 1, weight: .X, shape: "CVVC",
                            onset: onset.consonant, coda: coda.consonant,
                            assumed: codaAssumed, rule: nil, ishbaa: false
                        ))
                    }
                    // التقاء الساكنين: حرف المدّ يسقط فيقصر المقطع.
                    edges[i].append(SyllableEdge(
                        from: i, to: afterNucleus + 1, weight: .L, shape: "CVC",
                        onset: onset.consonant, coda: coda.consonant,
                        assumed: codaAssumed, rule: "التقاء الساكنين", ishbaa: false
                    ))
                }
            }
        }

        if ishbaa {
            var extra: [(Int, SyllableEdge)] = []
            for group in edges {
                for e in group where e.to == n && e.weight == .S {
                    extra.append((e.from, SyllableEdge(
                        from: e.from, to: n, weight: .L, shape: e.shape,
                        onset: e.onset, coda: e.coda, assumed: e.assumed,
                        rule: "إشباع حركة الروي", ishbaa: true
                    )))
                }
            }
            for (from, e) in extra { edges[from].append(e) }
        }

        return SyllableDag(edges: edges, size: n, assumedVocalization: assumed)
    }

    /// التقطيع الحرّ — يصلح حين لا يحتمل النصّ إلا قراءة واحدة.
    public static func freeSyllabify(_ dag: SyllableDag, limit: Int = 64)
        -> (certain: Bool, syllables: [SyllableEdge], pathCount: Int) {
        var paths: [[SyllableEdge]] = []
        var truncated = false

        func walk(_ node: Int, _ acc: inout [SyllableEdge]) {
            if paths.count >= limit { truncated = true; return }
            if node == dag.size { paths.append(acc); return }
            for e in dag.edges[node] {
                acc.append(e)
                walk(e.to, &acc)
                acc.removeLast()
                if paths.count >= limit { truncated = true; return }
            }
        }
        var acc: [SyllableEdge] = []
        walk(0, &acc)

        if truncated || paths.isEmpty { return (false, [], paths.count) }
        let patterns = Set(paths.map { $0.map { $0.weight.rawValue }.joined() })
        let preferred = paths.sorted {
            let a = ($0.last?.ishbaa ?? false) ? 0 : 1
            let b = ($1.last?.ishbaa ?? false) ? 0 : 1
            if a != b { return a < b }
            return $0.count < $1.count
        }[0]
        return (patterns.count == 1, preferred, paths.count)
    }
}

// MARK: - النمط الرقمي

/// طبقة عرض بحتة. لا رقم مكتوب في الكود — كلها من encodings.json.
public struct DigitalPattern: Sendable {
    let schemes: [String: EncodingScheme]
    public let defaultScheme: String

    public init(schemes: [EncodingScheme], defaultScheme: String) {
        self.schemes = Dictionary(uniqueKeysWithValues: schemes.map { ($0.id, $0) })
        self.defaultScheme = defaultScheme
    }

    public struct Encoded: Sendable {
        public let schemeId: String
        public let status: String
        public let value: String?
    }

    public func encode(_ syllables: [SyllableWeight], shapes: [String]? = nil, scheme id: String? = nil) throws -> Encoded {
        let sid = id ?? defaultScheme
        guard let scheme = schemes[sid] else { throw EngineError.unknownScheme(sid) }
        guard scheme.enabled != false, let map = scheme.map else {
            return Encoded(schemeId: sid, status: scheme.status, value: nil)
        }
        let sep = scheme.separator ?? ""
        if scheme.level == "letter" {
            let moving = map["moving"] ?? "1"
            let still = map["still"] ?? "0"
            let parts = syllables.enumerated().map { (i, w) -> String in
                let shape = shapes?.indices.contains(i) == true ? shapes![i] : w.defaultShape
                switch shape {
                case "CV": return moving
                case "CVV", "CVC": return moving + still
                case "CVVC", "CVCC": return moving + still + still
                default: return moving
                }
            }
            return Encoded(schemeId: sid, status: scheme.status, value: parts.joined(separator: sep))
        }
        let parts = syllables.map { map[$0.rawValue] ?? "?" }
        return Encoded(schemeId: sid, status: scheme.status, value: parts.joined(separator: sep))
    }

    public func encodeAll(_ syllables: [SyllableWeight], shapes: [String]? = nil) -> [String: Encoded] {
        var out: [String: Encoded] = [:]
        for id in schemes.keys {
            if let e = try? encode(syllables, shapes: shapes, scheme: id) { out[id] = e }
        }
        return out
    }
}
