import XCTest
@testable import PoetryEngine

final class TextNormalizerTests: XCTestCase {
    func testEmptyInputProducesNoWords() {
        let result = TextNormalizer.normalize("")
        XCTAssertTrue(result.words.isEmpty)
        XCTAssertFalse(result.hadNonArabicContent)
    }

    func testWhitespaceAndPunctuationAreStripped() {
        let result = TextNormalizer.normalize("  بيت ،  شعري!  ")
        XCTAssertEqual(result.words, ["بيت", "شعري"])
    }

    func testNonArabicContentIsIgnoredNotCrashing() {
        let result = TextNormalizer.normalize("بيت 😀 شعري 123 hello")
        XCTAssertEqual(result.words, ["بيت", "شعري"])
        XCTAssertTrue(result.hadNonArabicContent)
    }

    func testTatweelIsStripped() {
        let result = TextNormalizer.normalize("بيـــت")
        XCTAssertEqual(result.words, ["بيت"])
    }

    func testDiacriticCoverageRatioFullyVocalized() {
        // بَيْتٌ: ب(فتحة) ي(سكون) ت(تنوين ضم) — ثلاثة أحرف، كلها مُشكَّلة.
        let result = TextNormalizer.normalize("بَيْتٌ")
        XCTAssertEqual(result.diacriticCoverageRatio, 1.0, accuracy: 0.0001)
    }

    func testDiacriticCoverageRatioUnvocalized() {
        let result = TextNormalizer.normalize("بيت")
        XCTAssertEqual(result.diacriticCoverageRatio, 0.0, accuracy: 0.0001)
    }

    func testMultipleSpacesCollapseBetweenWords() {
        let result = TextNormalizer.normalize("كلمة1    كلمة2")
        XCTAssertEqual(result.words, ["كلمة", "كلمة"])
    }
}
