import XCTest
@testable import NabatiProsody

/// اختبارات حزمة Swift.
///
/// تُقرأ الحالات من نفس `golden_cases.json` الذي تقرؤه اختبارات
/// جافاسكربت، فأي انحراف بين التنفيذين يظهر هنا فشلًا لا يُخطَأ فيه.
final class EngineTests: XCTestCase {

    private func makeEngine() throws -> ProsodyEngine { try ProsodyEngine() }

    // MARK: البيانات

    func testDataLoads() throws {
        let engine = try makeEngine()
        XCTAssertEqual(engine.registry.meters.count, 13, "البحور الثلاثة عشر")
        XCTAssertEqual(engine.registry.enabled.count, 12, "اثنا عشر مفعَّلًا والهلالي معطَّل")
    }

    func testNoIntegrityProblems() throws {
        let engine = try makeEngine()
        XCTAssertTrue(
            engine.registry.problems.isEmpty,
            "تعارض في البيانات: \(engine.registry.problems.map(\.detail))"
        )
    }

    func testHilaliStaysDisabled() throws {
        let engine = try makeEngine()
        let h = engine.registry.meters.first { $0.id == "al_hilali_taweel" }
        XCTAssertNotNil(h)
        XCTAssertFalse(h!.enabled, "لا يُفعَّل قبل أن يصل تحقّق")
    }

    func testSakhriKeepsSourceTafila() throws {
        let engine = try makeEngine()
        let s = engine.registry.meters.first { $0.id == "al_sakhri" }
        XCTAssertEqual(s?.feet.first?.plain, "مفاعلاتن", "التفعيلة كما وردت في المصدر لا كما صُحّحت")
    }

    func testAliases() throws {
        let engine = try makeEngine()
        XCTAssertEqual(engine.registry.find("الشيباني")?.id, "al_hazaj")
        XCTAssertEqual(engine.registry.find("اللويحاني")?.id, "al_hazaj")
        XCTAssertEqual(engine.registry.find("الهجيني")?.id, "al_hajini")
    }

    // MARK: الأصوات — نفس حالات جافاسكربت

    func testGoldenPhonology() throws {
        let engine = try makeEngine()
        for c in engine.data.goldenPhonology {
            let got = engine.syllabify(c.input).free.syllables.map { $0.weight.rawValue }
            XCTAssertEqual(got, c.expectSyllables, "\(c.id) — «\(c.input)» — \(c.why)")
        }
    }

    func testShaddaSplitsIntoTwoUnits() throws {
        let engine = try makeEngine()
        let units = engine.syllabify("مَدَّ").units
        XCTAssertEqual(units.count, 3, "م + د ساكنة + د متحركة")
        XCTAssertTrue(units[1].vowel.isSilent, "الأول من المشدّد ساكن")
    }

    func testTanweenBecomesNoon() throws {
        let engine = try makeEngine()
        let units = engine.syllabify("كِتَابٌ").units
        XCTAssertEqual(units.last?.consonant, Ar.noon)
        XCTAssertEqual(units.last?.vowel.isSilent, true)
    }

    func testSunLetterDropsLam() throws {
        let engine = try makeEngine()
        let units = engine.syllabify("الشَّمْسُ").units
        XCTAssertFalse(units.contains { $0.consonant == Ar.lam }, "اللام الشمسية لا تُنطق")
    }

    // MARK: المطابقة

    func testEachMeterMatchesItself() throws {
        let engine = try makeEngine()
        for meter in engine.registry.enabled {
            let r = try engine.matchPattern(meter.pattern, meter: meter.id)
            XCTAssertEqual(r.score, 1.0, accuracy: 1e-9, "\(meter.name) لا يطابق نفسه")
            XCTAssertTrue(r.brokenFeet.isEmpty, "\(meter.name) فيه كسر في مطابقة ذاته")
            XCTAssertEqual(r.verdict, "sound", meter.name)
        }
    }

    func testEachMeterTopsItsOwnPattern() throws {
        let engine = try makeEngine()
        for meter in engine.registry.enabled {
            let ranked = engine.rankPattern(meter.pattern)
            let top = ranked.filter { $0.score >= ranked[0].score - 1e-9 }.map(\.meterId)
            XCTAssertTrue(top.contains(meter.id), "\(meter.name) تصدّره \(ranked[0].name)")
        }
    }

    func testZihafAcceptedCheaply() throws {
        let engine = try makeEngine()
        let r = try engine.matchPattern(pattern("SLSLLLSLLSLL"), meter: "المسحوب")
        XCTAssertGreaterThan(r.score, 0.9, "الخبن جائز")
        XCTAssertLessThan(r.score, 1.0, "وليس مجانًا")
        XCTAssertEqual(r.feet.first?.variantId, "khabn")
    }

    func testBrokenFootIsLocated() throws {
        let engine = try makeEngine()
        let r = try engine.matchPattern(pattern("LLSLLLSLLLLL"), meter: "المسحوب")
        XCTAssertFalse(r.brokenFeet.isEmpty)
        XCTAssertEqual(r.brokenFeet.first?.footIndex, 2, "الخلل في التفعيلة الثالثة")
        XCTAssertFalse(r.brokenFeet.first!.issues.isEmpty, "يجب بيان المقطع المختلف")
    }

    func testLengthSeparatesOverlappingMeters() throws {
        let engine = try makeEngine()
        XCTAssertEqual(engine.rankPattern(pattern("LLSLLLSL"))[0].meterId, "al_hada")
        XCTAssertEqual(engine.rankPattern(pattern("LLSLLLSLLLSLLLSL"))[0].meterId, "al_rajaz")
    }

    func testAllFeetBrokenIsNotCloseToAnything() throws {
        let engine = try makeEngine()
        let r = engine.rankPattern(pattern("SSSSSSSSSSSS"))
        XCTAssertEqual(r[0].verdict, "unrecognized",
                       "درجته \(r[0].score) على \(r[0].name) لكن كل تفعيلاته مختلّة")
    }

    func testScoreIsDeterministic() throws {
        let engine = try makeEngine()
        let a = try engine.matchPattern(pattern("LLSLLLSLLSLL"), meter: "المسحوب")
        let b = try engine.matchPattern(pattern("LLSLLLSLLSLL"), meter: "المسحوب")
        XCTAssertEqual(a.score, b.score)
        XCTAssertEqual(a.cost, b.cost)
    }

    func testScoreStaysInRange() throws {
        let engine = try makeEngine()
        for p in ["SSSSSSSSSSSS", "LLLLLLLLLLLL", "LLSLLLSLLSLL", "S"] {
            for m in engine.rankPattern(pattern(p)) {
                XCTAssertTrue(m.score >= 0 && m.score <= 1, "\(p) أعطى \(m.score)")
            }
        }
    }

    // MARK: التحليل الكامل

    func testAnalyzeVocalizedMaskhub() throws {
        let engine = try makeEngine()
        let r = engine.analyze("مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ")
        XCTAssertEqual(r.bestMeter?.id, "al_maskhub")
        XCTAssertEqual(r.verdict, "sound")
        XCTAssertFalse(r.assumedVocalization, "المشكول لا يحتاج افتراضًا")
        XCTAssertEqual(r.internalPattern, "LLSLLLSLLSLL")
        XCTAssertEqual(r.tafaeel.count, 3)
    }

    func testNumericPatternIsDisplayOnly() throws {
        let engine = try makeEngine()
        let r = engine.analyze("مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ")
        XCTAssertEqual(r.numericPatterns["binary_1_2"]?.value, "221222122122")
        XCTAssertNil(r.numericPatterns["nabati_app"]?.value, "ترميز التطبيق غير مثبت فلا يُخترع")
    }

    func testBrokenLineIsReportedAsBroken() throws {
        let engine = try makeEngine()
        let r = engine.analyze("مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَعُولُنْ")
        XCTAssertEqual(r.verdict, "broken")
        XCTAssertFalse(r.brokenFeet.isEmpty)
    }

    func testPoemFindsDominantMeter() throws {
        let engine = try makeEngine()
        let maskhub = "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ"
        let hajini = "فَاعِلَاتُنْ فَعُولُنْ فَاعِلَاتُنْ فَعُولُنْ"
        let r = engine.analyzePoem([maskhub, maskhub, maskhub, hajini].joined(separator: "\n"))
        XCTAssertEqual(r.lineCount, 4)
        XCTAssertEqual(r.dominantMeter?.id, "al_maskhub")
        XCTAssertEqual(r.dominantMeter?.lines, 3)
        XCTAssertEqual(r.outliers.count, 1)
    }

    func testOpenQuestionsAreDeclared() throws {
        let engine = try makeEngine()
        let q = engine.openQuestions()
        XCTAssertGreaterThanOrEqual(q.count, 4, "ما لم يُحسم يجب أن يبقى معلنًا")
        XCTAssertTrue(q.contains { $0.contains("missing_meter") }, "السامري مفقود")
    }

    // MARK: أدوات

    private func pattern(_ s: String) -> [SyllableWeight] {
        s.compactMap { SyllableWeight(rawValue: String($0)) }
    }
}
