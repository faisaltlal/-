import XCTest
@testable import PoetryEngine

/// يتحقق من الأنماط الرقمية المعيارية لكل تفعيلة في `meters.json`، مُحسوبة يدويًا مسبقًا في POETRY_ENGINE.md
/// ومطابَقة هنا لضمان أن أي تعديل مستقبلي على قواعد التحويل لا يكسر تعريف التفعيلات الأساسية بصمت.
final class FootLibraryTests: XCTestCase {
    private var library: FootLibrary!

    override func setUp() {
        super.setUp()
        library = MeterCatalog.shared.footLibrary
    }

    func testMustafilunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "مستفعلن"), "1010110")
    }

    func testFaulunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "فعولن"), "11010")
    }

    func testMafaeelunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "مفاعيلن"), "1101010")
    }

    func testFailatunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "فاعلاتن"), "1011010")
    }

    func testFailatunKhabnPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "فعلاتن"), "111010")
    }

    func testFailunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "فاعلن"), "10110")
    }

    func testMutafilunKhabnPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "متفعلن"), "110110")
    }

    func testFauluQabdPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "فعول"), "1101")
    }

    func testMustailunTayyPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "مستعلن"), "101110")
    }

    func testMufaalatunPattern() {
        XCTAssertEqual(library.pattern(forFootNamed: "مفاعلتن"), "1101110")
    }

    func testCatalogLoadsAllSixStarterMeters() {
        let ids = Set(MeterCatalog.shared.meters.map(\.id))
        XCTAssertEqual(ids, ["hijaini", "mashoob", "samri", "hilali", "sakhri", "hadaa"])
    }
}
