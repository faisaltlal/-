import Foundation
import os

/// التنفيذ الافتراضي: يسجّل محليًا فقط عبر `os_log`، بلا أي إرسال خارجي. راجع
/// FirebaseCrashReportingService.swift لتفعيل Crashlytics الفعلي بعد إضافة الحزمة من Xcode.
struct ConsoleCrashReportingService: CrashReportingService {
    private let logger = Logger(subsystem: "com.placeholder.poetrymeter", category: "crash-reporting")

    func recordNonFatalError(_ error: Error, screen: String) {
        logger.error("[CrashReporting] non-fatal in \(screen, privacy: .public): \(String(describing: error), privacy: .public)")
    }

    func setCustomValue(_ value: String, forKey key: String) {
        logger.debug("[CrashReporting] \(key, privacy: .public) = \(value, privacy: .public)")
    }

    func log(_ message: String) {
        logger.debug("[CrashReporting] \(message, privacy: .public)")
    }
}
