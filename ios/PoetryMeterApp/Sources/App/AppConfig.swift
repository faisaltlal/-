import Foundation

/// كل القيم القابلة للتغيير لاحقًا (الاسم، الهوية، الألوان الأساسية) في مكان واحد، بانتظار تحديد
/// الاسم النهائي واللوقو والهوية البصرية للتطبيق (خارج نطاق هذه المرحلة — راجع طلب المستخدم الأصلي).
enum AppConfig {
    /// اسم Placeholder احترافي مؤقت. غيّره هنا فقط عند اعتماد الاسم النهائي (وحدّث أيضًا
    /// CFBundleDisplayName عبر APP_DISPLAY_NAME في project.yml لكل إعداد بناء).
    static let appName = "Poetry Meter"

    /// بريد دعم Placeholder — غيّره عند تحديد قناة الدعم الفعلية.
    static let supportEmail = "support@example.com"

    static var buildConfiguration: BuildConfiguration {
        #if DEBUG
        return .debug
        #elseif BETA
        return .beta
        #else
        return .release
        #endif
    }
}

enum BuildConfiguration {
    case debug
    case beta
    case release

    /// هل تُعرض أدوات التطوير (مدة التحليل، تفاصيل المحرك الخام...) في الواجهة؟ لا تظهر أبدًا في Release.
    var showsDeveloperDiagnostics: Bool {
        switch self {
        case .debug: return true
        case .beta, .release: return false
        }
    }
}
