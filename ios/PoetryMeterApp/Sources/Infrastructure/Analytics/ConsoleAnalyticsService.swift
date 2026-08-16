import Foundation
import os

/// التنفيذ الافتراضي: يطبع الأحداث في وحدة التحكم عبر `os_log` فقط (Debug/Beta)، ولا يرسل أي بيانات
/// لأي خادم. يعمل التطبيق به دون أي اعتماد خارجي — Firebase اختياري ويُفعَّل فقط بعد إضافته من Xcode
/// (راجع FirebaseAnalyticsService.swift وREADME.md قسم "إعداد Firebase").
struct ConsoleAnalyticsService: AnalyticsService {
    private let logger = Logger(subsystem: "com.placeholder.poetrymeter", category: "analytics")

    func logEvent(_ name: AnalyticsEvent, parameters: [String: String]) {
        guard AppConfig.buildConfiguration.showsDeveloperDiagnostics else { return }
        logger.debug("[Analytics] \(name.rawValue, privacy: .public) \(parameters, privacy: .public)")
    }
}
