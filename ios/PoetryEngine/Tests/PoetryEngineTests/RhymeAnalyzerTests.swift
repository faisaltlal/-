import XCTest
@testable import PoetryEngine

final class RhymeAnalyzerTests: XCTestCase {
    private func units(for word: String) -> [ProsodicUnit] {
        ProsodicTranscriber.transcribe(words: [word], isAbsoluteStart: true).units
    }

    func testMatchingRawiIsConsistent() {
        let first = units(for: "قَمَرْ")
        let second = units(for: "سَمَرْ")
        let result = RhymeAnalyzer.analyze(firstUnits: first, secondUnits: second)
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.firstHemistichRawi, "ر")
        XCTAssertEqual(result?.secondHemistichRawi, "ر")
        XCTAssertTrue(result?.isConsistent ?? false)
    }

    func testDifferentRawiIsNotConsistent() {
        let first = units(for: "سَمَرْ")
        let second = units(for: "قَلَمْ")
        let result = RhymeAnalyzer.analyze(firstUnits: first, secondUnits: second)
        XCTAssertNotNil(result)
        XCTAssertNotEqual(result?.firstHemistichRawi, result?.secondHemistichRawi)
        XCTAssertFalse(result?.isConsistent ?? true)
    }

    func testEmptyHemistichReturnsNilRhyme() {
        let result = RhymeAnalyzer.analyze(firstUnits: [], secondUnits: [])
        XCTAssertNil(result)
    }

    func testMaddLetterAtEndIsSkippedForRawi() {
        // فتى وقنا: الحرف الأخير في الكتابتين مدّ ساكن صرف، فحرف الروي الحقيقي هو ما قبله.
        let fata = units(for: "فَتَى")
        let qanaa = units(for: "قَنَا")
        let result = RhymeAnalyzer.analyze(firstUnits: fata, secondUnits: qanaa)
        XCTAssertEqual(result?.firstHemistichRawi, "ت")
        XCTAssertEqual(result?.secondHemistichRawi, "ن")
        XCTAssertFalse(result?.isConsistent ?? true)
    }
}
