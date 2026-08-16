import Foundation
import PoetryEngine

/// حالة استخدام تربط استدعاء محرك الوزن بإرسال أحداث Analytics — المحرك نفسه (`PoetryEngine`) لا يعرف
/// شيئًا عن Analytics إطلاقًا. **لا يُرسَل نص البيت نفسه لأي خدمة تحليلات أبدًا**، فقط اسم البحر/الطاروق
/// الناتج (إن طابق) — راجع ANALYTICS.md لسياسة الخصوصية الكاملة.
struct AnalyzePoemUseCase {
    private let engine: PoetryEngine
    private let analytics: AnalyticsService
    private let crashReporting: CrashReportingService

    init(
        engine: PoetryEngine = PoetryEngine(),
        analytics: AnalyticsService = ServiceContainer.analytics,
        crashReporting: CrashReportingService = ServiceContainer.crashReporting
    ) {
        self.engine = engine
        self.analytics = analytics
        self.crashReporting = crashReporting
    }

    func execute(_ text: String) -> AnalysisResult {
        crashReporting.log("analysis_started")
        let result = engine.analyze(text)

        analytics.logEvent(.poemAnalyzed)
        if result.isMetered {
            analytics.logEvent(.analysisSucceeded)
            if let meterName = result.meter?.meter.name {
                analytics.logEvent(.meterDetected, parameters: ["meter": meterName])
            }
            if let tarooqName = result.tarooq?.name {
                analytics.logEvent(.tarooqDetected, parameters: ["tarooq": tarooqName])
            }
        } else {
            analytics.logEvent(.analysisFailed)
        }
        return result
    }
}
