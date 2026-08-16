import XCTest
@testable import PoetryEngine

/// مجموعة اختبارات دائمة: كل حالة هنا تمثّل خطأً فعليًا اكتُشف أثناء تطوير المحرك وأُصلح، وتبقى مسجَّلة هنا
/// لضمان عدم تكراره مستقبلًا. أضف حالة جديدة إلى هذا الملف عند اكتشاف أي خطأ وزن جديد (راجع TESTING.md).
final class RegressionTests: XCTestCase {
    /// خطأ اكتُشف أثناء البناء الأولي للمحرك (بالتتبّع اليدوي قبل توفر مُصرِّف Swift في بيئة التطوير):
    /// كانت دالة معالجة "أل" التعريف تُرجع فهرسًا خاطئًا (`sunLetterIndex + 1`) في حالة الحرف القمري تحديدًا،
    /// فتُسقِط المسحة الرئيسية معالجة الحرف الذي يلي اللام مباشرة (يختفي حرف كامل من الكلمة).
    /// أُصلح بإرجاع `sunLetterIndex` (بلا زيادة) في فرع الحرف القمري فقط، تاركًا الحرف نفسه للمسح الرئيسي.
    func testRegression_MoonLetterDoesNotDropFollowingLetter() {
        let (units, _) = ProsodicTranscriber.transcribe(words: ["القمر"], isAbsoluteStart: true)
        XCTAssertEqual(units.count, 5, "يجب أن تظهر كل أحرف «القمر» الخمسة، بلا حذف الحرف الذي يلي اللام القمرية")
        XCTAssertEqual(units[1].display, "لْ")
        XCTAssertEqual(units[2].display, "قَ")
    }

    /// تأكيد أن الإصلاح أعلاه لم يكسر الفرع الشمسي (الذي يجب أن يبقى يتخطى الحرف الشمسي المُستهلَك فعلًا).
    func testRegression_SunLetterStillConsumedExactlyOnce() {
        let (units, _) = ProsodicTranscriber.transcribe(words: ["الشمس"], isAbsoluteStart: true)
        XCTAssertEqual(units.count, 5)
        XCTAssertFalse(units.contains { $0.display == "لْ" || $0.display.hasPrefix("لَ") || $0.display.hasPrefix("لِ") })
    }
}
