import XCTest
import PoetryEngine
@testable import PoetryMeterApp

/// يتحقق من أهم قيد خصوصية في التطبيق كله: لا يصل نص البيت الشعري أبدًا إلى طبقة Analytics/Crash
/// Reporting — فقط اسم البحر/الطاروق الناتج (إن وُجد). راجع ANALYTICS.md.
final class AnalyzePoemUseCaseTests: XCTestCase {
    final class SpyAnalyticsService: AnalyticsService {
        private(set) var loggedEvents: [(AnalyticsEvent, [String: String])] = []
        func logEvent(_ name: AnalyticsEvent, parameters: [String: String]) {
            loggedEvents.append((name, parameters))
        }
    }

    final class SpyCrashReportingService: CrashReportingService {
        private(set) var loggedMessages: [String] = []
        func recordNonFatalError(_ error: Error, screen: String) {}
        func setCustomValue(_ value: String, forKey key: String) {}
        func log(_ message: String) { loggedMessages.append(message) }
    }

    func testPoemTextNeverAppearsInAnalyticsParameters() {
        let analytics = SpyAnalyticsService()
        let crashReporting = SpyCrashReportingService()
        let useCase = AnalyzePoemUseCase(
            engine: PoetryEngine(),
            analytics: analytics,
            crashReporting: crashReporting
        )

        let secretPoem = "يا ما بنيت القصر وأعليت جدرانه سرًّا لا يعرفه أحد"
        _ = useCase.execute(secretPoem)

        for (_, parameters) in analytics.loggedEvents {
            for value in parameters.values {
                XCTAssertFalse(secretPoem.contains(value), "تسرَّب جزء من نص البيت إلى معامِلات Analytics")
                XCTAssertNotEqual(value, secretPoem)
            }
        }
        for message in crashReporting.loggedMessages {
            XCTAssertFalse(message.contains(secretPoem))
        }
    }

    func testMeterDetectedEventCarriesOnlyMeterName() {
        let analytics = SpyAnalyticsService()
        let useCase = AnalyzePoemUseCase(
            engine: PoetryEngine(),
            analytics: analytics,
            crashReporting: SpyCrashReportingService()
        )

        let shatr = "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ"
        _ = useCase.execute(shatr + "   " + shatr)

        let meterEvent = analytics.loggedEvents.first { $0.0 == .meterDetected }
        XCTAssertEqual(meterEvent?.1["meter"], "الهجيني")
    }
}
