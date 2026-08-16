import XCTest
@testable import PoetryEngine

final class MeterDetectionTests: XCTestCase {
    private var catalog: MeterCatalog!
    private var matcher: MeterMatcher!

    override func setUp() {
        super.setUp()
        catalog = MeterCatalog.shared
        matcher = MeterMatcher(catalog: catalog)
    }

    private func patternForShatr(_ tafeelaWords: [String]) -> String {
        let (units, _) = ProsodicTranscriber.transcribe(words: tafeelaWords, isAbsoluteStart: true)
        return NumericPatternBuilder.pattern(from: units)
    }

    func testHijainiTamDetectedFromItsOwnCanonicalSpelling() {
        let pattern = patternForShatr(["مُسْتَفْعِلُنْ", "مُسْتَفْعِلُنْ", "مُسْتَفْعِلُنْ", "مُسْتَفْعِلُنْ"])
        let outcome = matcher.match(pattern: pattern)
        XCTAssertEqual(outcome.best?.meter.id, "hijaini")
        XCTAssertEqual(outcome.best?.matchedTarooq.id, "hijaini-tam")
        XCTAssertEqual(outcome.best?.similarity ?? 0, 1.0, accuracy: 0.0001)
        XCTAssertTrue(outcome.isExactOrNearMatch)
    }

    func testMashoobTamDetectedFromItsOwnCanonicalSpelling() {
        let pattern = patternForShatr(["فَعُولُنْ", "مَفَاعِيلُنْ", "فَعُولُنْ", "مَفَاعِيلُنْ"])
        let outcome = matcher.match(pattern: pattern)
        XCTAssertEqual(outcome.best?.meter.id, "mashoob")
        XCTAssertEqual(outcome.best?.similarity ?? 0, 1.0, accuracy: 0.0001)
    }

    func testSamriTamDetectedFromItsOwnCanonicalSpelling() {
        let pattern = patternForShatr(["فَاعِلَاتُنْ", "فَاعِلَاتُنْ", "فَاعِلَاتُنْ"])
        let outcome = matcher.match(pattern: pattern)
        XCTAssertEqual(outcome.best?.meter.id, "samri")
        XCTAssertEqual(outcome.best?.similarity ?? 0, 1.0, accuracy: 0.0001)
    }

    func testHijainiMakhboonVariantDetectedViaTarooq() {
        let pattern = patternForShatr(["مُتَفْعِلُنْ", "مُسْتَفْعِلُنْ", "مُتَفْعِلُنْ", "مُسْتَفْعِلُنْ"])
        let outcome = matcher.match(pattern: pattern)
        XCTAssertEqual(outcome.best?.meter.id, "hijaini")
        XCTAssertEqual(outcome.best?.matchedTarooq.id, "hijaini-makhboon")
        XCTAssertEqual(outcome.best?.similarity ?? 0, 1.0, accuracy: 0.0001)
    }

    func testCompletelyUnrelatedPatternIsNotMetered() {
        let outcome = matcher.match(pattern: "111111111111")
        XCTAssertFalse(outcome.isExactOrNearMatch)
        XCTAssertFalse(outcome.alternatives.isEmpty)
    }

    func testEmptyPatternProducesNoMatch() {
        let outcome = matcher.match(pattern: "")
        XCTAssertNil(outcome.best)
        XCTAssertFalse(outcome.isExactOrNearMatch)
    }

    func testFullEngineDetectsHijainiFromTwoHemistichBait() {
        let shatr = "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ"
        let bait = shatr + "   " + shatr
        let result = PoetryEngine().analyze(bait)

        XCTAssertTrue(result.isMetered)
        XCTAssertEqual(result.meter?.meter.id, "hijaini")
        XCTAssertEqual(result.feet.count, 8)
        XCTAssertFalse(result.errors.contains(.missingDiacriticsReducesAccuracy))
        XCTAssertFalse(result.errors.contains(.couldNotSplitHemistichs))
        XCTAssertGreaterThan(result.confidence, 0.9)
    }
}
