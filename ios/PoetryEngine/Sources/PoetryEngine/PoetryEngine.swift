import Foundation

/// نقطة الدخول العامة لمحرك التحليل العروضي. لا تعرف أي شيء عن SwiftUI أو UIKit — Swift + Foundation فقط،
/// وتُختبر بشكل مستقل عبر `swift test`. راجع `POETRY_ENGINE.md` لشرح كامل المنهج والمراجع.
///
/// الاستخدام:
/// ```swift
/// let engine = PoetryEngine()
/// let result = engine.analyze("ياما بنيت القصر وأعليت جدرانه")
/// ```
public struct PoetryEngine: Sendable {
    private let catalog: MeterCatalog
    private let matcher: MeterMatcher

    /// النص الأطول المسموح به لتحليل واحد (بيت واحد عادة لا يتجاوز هذا بكثير). النصوص الأطول لا تُرفض،
    /// لكن تُضاف كتنبيه في `errors` لأن جودة النتيجة تتراجع مع تعدد الأبيات في إدخال واحد.
    private let maxRecommendedLength = 400

    public init(catalog: MeterCatalog = .shared) {
        self.catalog = catalog
        self.matcher = MeterMatcher(catalog: catalog)
    }

    public func analyze(_ rawText: String) -> AnalysisResult {
        let startedAt = Date()
        var errors: [AnalysisError] = []

        let trimmed = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return emptyResult(errors: [.emptyInput], startedAt: startedAt)
        }

        let split = HemistichSplitter.split(trimmed)
        let hasSecondHemistich = !split.secondRaw.isEmpty
        if !split.wasExplicit && hasSecondHemistich {
            errors.append(.couldNotSplitHemistichs)
        }
        if trimmed.count > maxRecommendedLength {
            errors.append(.textTooLong)
        }

        let firstNormalized = TextNormalizer.normalize(split.firstRaw)
        let secondNormalized: NormalizedText? = hasSecondHemistich ? TextNormalizer.normalize(split.secondRaw) : nil

        if firstNormalized.hadNonArabicContent || (secondNormalized?.hadNonArabicContent ?? false) {
            errors.append(.inputContainsNonArabicCharacters)
        }
        guard !firstNormalized.words.isEmpty else {
            return emptyResult(errors: errors + [.noRecognizableArabicText], startedAt: startedAt)
        }

        let (firstUnits, firstProsodic) = ProsodicTranscriber.transcribe(words: firstNormalized.words, isAbsoluteStart: true)
        var secondUnits: [ProsodicUnit] = []
        var secondProsodic = ""
        if let secondNormalized, !secondNormalized.words.isEmpty {
            let transcribed = ProsodicTranscriber.transcribe(words: secondNormalized.words, isAbsoluteStart: false)
            secondUnits = transcribed.units
            secondProsodic = transcribed.prosodicText
        }

        let allUnits = firstUnits + secondUnits
        let fullPattern = NumericPatternBuilder.pattern(from: allUnits)
        let fullProsodicText = secondProsodic.isEmpty ? firstProsodic : "\(firstProsodic)  ..  \(secondProsodic)"

        let diacriticRatio = combinedDiacriticRatio(firstNormalized, secondNormalized)
        if diacriticRatio < 0.5 {
            errors.append(.missingDiacriticsReducesAccuracy)
        }

        let firstPattern = NumericPatternBuilder.pattern(from: firstUnits)
        let firstOutcome = matcher.match(pattern: firstPattern)
        var overallOutcome = firstOutcome

        if !secondUnits.isEmpty {
            let secondPattern = NumericPatternBuilder.pattern(from: secondUnits)
            let secondOutcome = matcher.match(pattern: secondPattern)

            if let firstBest = firstOutcome.best, let secondBest = secondOutcome.best,
               firstBest.meter.id == secondBest.meter.id {
                // الشطران يتفقان على نفس البحر: الثقة تُبنى على أضعف تشابه بينهما (الأكثر تحفظًا وصدقًا).
                let combinedSimilarity = min(firstBest.similarity, secondBest.similarity)
                let combinedBest = MeterMatch(meter: firstBest.meter, matchedTarooq: firstBest.matchedTarooq, similarity: combinedSimilarity)
                overallOutcome = MeterMatcher.MatchOutcome(
                    best: combinedBest,
                    alternatives: firstOutcome.alternatives,
                    isExactOrNearMatch: firstOutcome.isExactOrNearMatch && secondOutcome.isExactOrNearMatch
                )
            } else if let secondBest = secondOutcome.best, let firstBest = firstOutcome.best,
                      secondBest.similarity > firstBest.similarity {
                overallOutcome = secondOutcome
            }
        }

        let isMetered = overallOutcome.isExactOrNearMatch && overallOutcome.best != nil

        var scannedFeet: [ScannedFoot] = []
        if let best = overallOutcome.best {
            scannedFeet = FootSegmenter.segment(units: firstUnits, tarooq: best.matchedTarooq, footLibrary: catalog.footLibrary)
            if !secondUnits.isEmpty {
                scannedFeet += FootSegmenter.segment(units: secondUnits, tarooq: best.matchedTarooq, footLibrary: catalog.footLibrary)
            }
        }

        let syllables = SyllableSegmenter.segment(units: allUnits)
        let rhyme = secondUnits.isEmpty ? nil : RhymeAnalyzer.analyze(firstUnits: firstUnits, secondUnits: secondUnits)

        let confidence = computeConfidence(
            diacriticRatio: diacriticRatio,
            matchSimilarity: overallOutcome.best?.similarity ?? 0,
            hadExplicitSplit: split.wasExplicit || !hasSecondHemistich,
            errors: errors
        )

        let durationMs = Date().timeIntervalSince(startedAt) * 1000

        return AnalysisResult(
            isMetered: isMetered,
            meter: overallOutcome.best,
            tarooq: overallOutcome.best?.matchedTarooq,
            confidence: confidence,
            prosodicText: fullProsodicText,
            feet: scannedFeet,
            numericPattern: fullPattern,
            syllables: syllables,
            rhyme: rhyme,
            rawAnalysis: RawAnalysis(
                normalizedText: fullProsodicText,
                hemistichSplit: hasSecondHemistich
                    ? [firstNormalized.joinedNormalized, secondNormalized?.joinedNormalized ?? ""]
                    : [firstNormalized.joinedNormalized],
                hadExplicitDiacritics: diacriticRatio > 0.9,
                diacriticCoverageRatio: diacriticRatio,
                analysisDurationMs: durationMs
            ),
            alternatives: overallOutcome.alternatives,
            errors: errors
        )
    }

    private func combinedDiacriticRatio(_ first: NormalizedText, _ second: NormalizedText?) -> Double {
        guard let second, !second.words.isEmpty else { return first.diacriticCoverageRatio }
        return (first.diacriticCoverageRatio + second.diacriticCoverageRatio) / 2.0
    }

    private func computeConfidence(
        diacriticRatio: Double, matchSimilarity: Double, hadExplicitSplit: Bool, errors: [AnalysisError]
    ) -> Double {
        var confidence = 0.4 * diacriticRatio + 0.6 * matchSimilarity
        if !hadExplicitSplit { confidence -= 0.1 }
        if errors.contains(.inputContainsNonArabicCharacters) { confidence -= 0.05 }
        return max(0.0, min(1.0, confidence))
    }

    private func emptyResult(errors: [AnalysisError], startedAt: Date) -> AnalysisResult {
        AnalysisResult(
            isMetered: false,
            meter: nil,
            tarooq: nil,
            confidence: 0,
            prosodicText: "",
            feet: [],
            numericPattern: "",
            syllables: [],
            rhyme: nil,
            rawAnalysis: RawAnalysis(
                normalizedText: "",
                hemistichSplit: [],
                hadExplicitDiacritics: false,
                diacriticCoverageRatio: 0,
                analysisDurationMs: Date().timeIntervalSince(startedAt) * 1000
            ),
            alternatives: [],
            errors: errors
        )
    }
}
