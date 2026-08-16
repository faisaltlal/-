import Foundation

/// نقطة تجميع واحدة لاختيار التنفيذ الفعلي (Firebase إن أُضيف، وإلا Console) — لا مكان آخر في الكود
/// يحتاج معرفة هل Firebase مُضاف أم لا.
enum ServiceContainer {
    static let analytics: AnalyticsService = {
        #if canImport(FirebaseAnalytics)
        return FirebaseAnalyticsService()
        #else
        return ConsoleAnalyticsService()
        #endif
    }()

    static let crashReporting: CrashReportingService = {
        #if canImport(FirebaseCrashlytics)
        return FirebaseCrashReportingService()
        #else
        return ConsoleCrashReportingService()
        #endif
    }()
}
