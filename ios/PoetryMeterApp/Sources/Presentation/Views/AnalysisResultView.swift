import SwiftUI
import PoetryEngine

/// حالة عرض النتيجة الثلاث كما طلب المستخدم: موزون / غير موزون / تعذّر تحديد الوزن بدقة.
private enum ResultDisplayState {
    case metered
    case notMetered
    case unclear
}

struct AnalysisResultView: View {
    let result: AnalysisResult
    let showsDeveloperDiagnostics: Bool

    private var state: ResultDisplayState {
        if result.prosodicText.isEmpty { return .unclear }
        if result.isMetered { return .metered }
        if result.confidence < 0.3 { return .unclear }
        return .notMetered
    }

    var body: some View {
        VStack(alignment: .trailing, spacing: 16) {
            switch state {
            case .metered:
                meteredContent
            case .notMetered:
                notMeteredContent
            case .unclear:
                unclearContent
            }

            if showsDeveloperDiagnostics {
                DeveloperDiagnosticsView(result: result)
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - موزون

    private var meteredContent: some View {
        VStack(alignment: .trailing, spacing: 12) {
            Label("موزون", systemImage: "checkmark.seal.fill")
                .font(.headline)
                .foregroundStyle(.green)
                .accessibilityLabel("البيت موزون")

            if let meter = result.meter {
                resultRow(title: "البحر", value: meter.meter.name)
                if let tarooq = result.tarooq {
                    resultRow(title: "الطاروق", value: tarooq.name)
                }
            }

            if !result.feet.isEmpty {
                resultRow(title: "التفعيلات", value: feetDescription)
            }

            resultRow(title: "الكتابة العروضية", value: result.prosodicText)
            resultRow(title: "النمط الرقمي", value: result.numericPattern)

            if let rhyme = result.rhyme {
                rhymeRow(rhyme)
            }
        }
    }

    private var feetDescription: String {
        result.feet.map { $0.footName ?? "؟" }.joined(separator: " | ")
    }

    // MARK: - غير موزون

    private var notMeteredContent: some View {
        VStack(alignment: .trailing, spacing: 12) {
            Label("البيت غير مطابق للوزن", systemImage: "xmark.seal")
                .font(.headline)
                .foregroundStyle(.orange)

            if let closest = result.alternatives.first {
                resultRow(title: "أقرب وزن محتمل", value: closest.meter.name)
            }
            resultRow(title: "الكتابة العروضية", value: result.prosodicText)
            resultRow(title: "النمط الرقمي", value: result.numericPattern)
        }
    }

    // MARK: - تعذّر التحديد

    private var unclearContent: some View {
        VStack(alignment: .trailing, spacing: 8) {
            Label("تعذّر تحديد الوزن بدقة", systemImage: "questionmark.circle")
                .font(.headline)
                .foregroundStyle(.secondary)

            ForEach(result.errors, id: \.self) { error in
                Text(error.localizedDescriptionAr)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.trailing)
            }
        }
    }

    // MARK: - عناصر مشتركة

    private func resultRow(title: String, value: String) -> some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.body)
                .textSelection(.enabled)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .accessibilityElement(children: .combine)
    }

    private func rhymeRow(_ rhyme: RhymeResult) -> some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text("القافية")
                .font(.caption)
                .foregroundStyle(.secondary)
            HStack {
                Image(systemName: rhyme.isConsistent ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                    .foregroundStyle(rhyme.isConsistent ? .green : .orange)
                Text(rhyme.isConsistent ? "الروي متطابق (\(rhyme.firstHemistichRawi ?? "-"))" : "الروي غير متطابق بين الشطرين")
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

/// معلومات تشخيصية لوضع التطوير فقط — لا تظهر أبدًا للمستخدم النهائي (راجع AppConfig.showsDeveloperDiagnostics).
private struct DeveloperDiagnosticsView: View {
    let result: AnalysisResult

    var body: some View {
        DisclosureGroup("تشخيص المطوّر") {
            VStack(alignment: .trailing, spacing: 4) {
                Text("مدة التحليل: \(String(format: "%.2f", result.rawAnalysis.analysisDurationMs)) مللي ثانية")
                Text("الثقة: \(String(format: "%.2f", result.confidence))")
                Text("تغطية التشكيل: \(String(format: "%.0f%%", result.rawAnalysis.diacriticCoverageRatio * 100))")
                Text("عدد الشطرين: \(result.rawAnalysis.hemistichSplit.count)")
                if !result.alternatives.isEmpty {
                    Text("البدائل: " + result.alternatives.map { "\($0.meter.name) (\(String(format: "%.2f", $0.similarity)))" }.joined(separator: "، "))
                }
            }
            .font(.caption.monospaced())
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .font(.caption)
    }
}
