import XCTest
@testable import PoetryEngine

/// اختبارات مُتحقَّق منها يدويًا خطوة بخطوة (راجع POETRY_ENGINE.md) لكل قاعدة تحويل عروضي على حدة،
/// بمعزل عن قاعدة بيانات البحور — تكشف أي كسر في منطق التحويل الأساسي فورًا.
final class ProsodicTranscriberTests: XCTestCase {
    func testShaddaExpandsToSakinThenMutaharrik() {
        // حَبَّ: ح(فتحة) بّ(شدة+فتحة) → ح(1) ب(0،إدغام) ب(1،بفتحته) = "101"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["حَبَّ"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "101")
        XCTAssertEqual(units.count, 3)
        XCTAssertFalse(units[1].isMutaharrik)
        XCTAssertTrue(units[2].isMutaharrik)
        XCTAssertEqual(units[2].harakah, .fatha)
    }

    func testTanwinExpandsToVowelPlusSakinNoon() {
        // بَابٌ: ب(فتحة) ا(مد) ب(تنوين ضم) → ب(1) ا(0) ب(1) ن(0) = "1010"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["بَابٌ"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "1010")
        XCTAssertEqual(units.count, 4)
        XCTAssertEqual(units[3].display, "نْ")
        XCTAssertFalse(units[3].isMutaharrik)
    }

    func testSukunIsSakinDirectly() {
        let (units, _) = ProsodicTranscriber.transcribe(words: ["يَكْتُبْ"], isAbsoluteStart: true)
        // ي(فتحة،1) ك(سكون،0) ت(ضمة،1) ب(سكون،0) — الحرف الأخير سُكونه مكتوب صراحة.
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "1010")
    }

    func testWawMaddAfterDammaIsSakin() {
        // يَقُولُ: ي(فتحة) ق(ضمة) و(مد بلا تشكيل) ل(ضمة) → 1,1,0,1 = "1101"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["يَقُولُ"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "1101")
    }

    func testYaMaddAfterKasraIsSakin() {
        // فِيلٌ: ف(كسرة) ي(مد بلا تشكيل) ل(تنوين ضم) → ف(1) ي(0) ل(1) ن(0) = "1010"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["فِيلٌ"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "1010")
    }

    func testSunLetterElidesLamAndDoublesFollowingLetter() {
        // الشمس (بلا تشكيل، بداية مطلقة): ا(فتحة،1) ش(سكون،إدغام،0) ش(فتحة افتراضية،1) م(1) س(1) = "10111"
        // ولا تظهر أي وحدة للام نفسها إطلاقًا (أُدغمت).
        let (units, _) = ProsodicTranscriber.transcribe(words: ["الشمس"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "10111")
        XCTAssertEqual(units.count, 5)
        XCTAssertEqual(units[1].display, "ش")
        XCTAssertFalse(units[1].isMutaharrik)
        XCTAssertEqual(units[2].display, "شَ")
        XCTAssertFalse(units.contains { $0.display.hasPrefix("ل") })
    }

    func testMoonLetterKeepsLamSakinAndFollowingLetterSeparate() {
        // القمر (بلا تشكيل، بداية مطلقة): ا(1) ل(0) ق(1) م(1) ر(1) = "10111" — نفس الطول، لكن اللام تظهر صراحة.
        let (units, _) = ProsodicTranscriber.transcribe(words: ["القمر"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "10111")
        XCTAssertEqual(units.count, 5)
        XCTAssertEqual(units[1].display, "لْ")
        XCTAssertFalse(units[1].isMutaharrik)
    }

    func testTaMarbutaAtHemistichEndIsSakinHa() {
        let (units, _) = ProsodicTranscriber.transcribe(words: ["مَدِينَةٌ"], isAbsoluteStart: true)
        XCTAssertEqual(units.last?.display, "هْ")
        XCTAssertFalse(units.last?.isMutaharrik ?? true)
    }

    func testJalalaSpecialCaseAtAbsoluteStart() {
        // الله (بداية مطلقة): اَ(1) لّ(0) لَ(1) ا(0) هْ(0) = "10100"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["الله"], isAbsoluteStart: true)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "10100")
    }

    func testJalalaSpecialCaseInWasl() {
        // والله (غير بداية مطلقة، ملحقة بواو): وَ(1) لّ(0) لَ(1) ا(0) هْ(0) = "10100"
        let (units, _) = ProsodicTranscriber.transcribe(words: ["والله"], isAbsoluteStart: false)
        XCTAssertEqual(NumericPatternBuilder.pattern(from: units), "10100")
    }

    func testNonArabicWordsAreSkippedGracefullyUpstream() {
        // المحرك نفسه لا يستقبل أبدًا كلمات غير عربية (تُفلتَر في TextNormalizer قبل الوصول هنا)،
        // لذا نتحقق أن كلمة فارغة لا تُنتج وحدات ولا تُعطّل المحرك.
        let (units, text) = ProsodicTranscriber.transcribe(words: [], isAbsoluteStart: true)
        XCTAssertTrue(units.isEmpty)
        XCTAssertEqual(text, "")
    }
}
