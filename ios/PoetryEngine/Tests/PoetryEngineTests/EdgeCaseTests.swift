import XCTest
@testable import PoetryEngine

/// تغطي كل الحالات "الحدّية" التي يجب ألا تُعطِّل المحرك إطلاقًا: نص فارغ، رموز غير عربية، نص طويل جدًا،
/// كلمة واحدة، ترقيم فقط. المحرك يجب أن يُعيد دائمًا `AnalysisResult` صالحة (لا يرمي استثناءً أبدًا).
final class EdgeCaseTests: XCTestCase {
    func testEmptyInputDoesNotCrashAndReportsError() {
        let result = PoetryEngine().analyze("")
        XCTAssertFalse(result.isMetered)
        XCTAssertEqual(result.confidence, 0)
        XCTAssertTrue(result.errors.contains(.emptyInput))
    }

    func testWhitespaceOnlyInputIsTreatedAsEmpty() {
        let result = PoetryEngine().analyze("    \n\t  ")
        XCTAssertTrue(result.errors.contains(.emptyInput))
    }

    func testNonArabicOnlyInputDoesNotCrash() {
        let result = PoetryEngine().analyze("Hello World 12345 😀😀😀")
        XCTAssertFalse(result.isMetered)
        XCTAssertTrue(result.errors.contains(.noRecognizableArabicText))
    }

    func testMixedArabicAndEmojiDoesNotCrash() {
        let result = PoetryEngine().analyze("يا ليل 😀 الصب متى غده")
        XCTAssertTrue(result.errors.contains(.inputContainsNonArabicCharacters))
        XCTAssertFalse(result.numericPattern.isEmpty)
    }

    func testVeryLongInputDoesNotCrashAndFlagsLength() {
        let longText = String(repeating: "يا ليل الصب متى غده ", count: 40)
        let result = PoetryEngine().analyze(longText)
        XCTAssertTrue(result.errors.contains(.textTooLong))
        XCTAssertFalse(result.numericPattern.isEmpty)
    }

    func testSingleWordInputDoesNotCrashAndHasNoRhyme() {
        let result = PoetryEngine().analyze("مرحبا")
        XCTAssertNil(result.rhyme)
    }

    func testPunctuationOnlyInputIsTreatedAsEmpty() {
        let result = PoetryEngine().analyze("!!! ، ، ؟؟؟")
        XCTAssertTrue(result.errors.contains(.noRecognizableArabicText) || result.errors.contains(.emptyInput))
    }

    func testUnvocalizedInputStillProducesAResultWithLowerConfidence() {
        let result = PoetryEngine().analyze("مستفعلن مستفعلن مستفعلن مستفعلن")
        XCTAssertTrue(result.errors.contains(.missingDiacriticsReducesAccuracy))
        XCTAssertFalse(result.numericPattern.isEmpty)
    }

    func testLatinDigitsAndArabicIndicDigitsAreIgnoredNotCrashing() {
        let result = PoetryEngine().analyze("بيت رقم 123 و٤٥٦ شعري")
        XCTAssertFalse(result.numericPattern.isEmpty)
    }

    func testRepeatedAnalysisCallsAreIndependent() {
        let engine = PoetryEngine()
        let first = engine.analyze("يا ليل الصب متى غده")
        let second = engine.analyze("")
        let third = engine.analyze("يا ليل الصب متى غده")
        XCTAssertEqual(first.numericPattern, third.numericPattern)
        XCTAssertTrue(second.errors.contains(.emptyInput))
    }
}
