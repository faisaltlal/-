import Foundation
import PoetryEngine

/// `ObservableObject` عادي (بدل ماكرو `@Observable`) عن قصد، لأن `@Observable` يتطلب iOS 17+،
/// والمشروع يستهدف iOS 16+ صراحة.
@MainActor
final class MeterAnalysisViewModel: ObservableObject {
    @Published var inputText: String = ""
    @Published private(set) var result: AnalysisResult?
    @Published private(set) var isAnalyzing = false

    private let useCase: AnalyzePoemUseCase

    init(useCase: AnalyzePoemUseCase = AnalyzePoemUseCase()) {
        self.useCase = useCase
    }

    var canAnalyze: Bool {
        !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isAnalyzing
    }

    func analyze() {
        guard canAnalyze else { return }
        isAnalyzing = true
        // المحرك محلي وسريع (مللي ثوانٍ) — لا حاجة لخيط خلفي، لكن isAnalyzing يبقى لعرض حالة تحميل
        // بسيطة تحسّبًا لأبيات طويلة جدًا لاحقًا، ولتعطيل الزر أثناء المعالجة.
        result = useCase.execute(inputText)
        isAnalyzing = false
    }

    func reset() {
        inputText = ""
        result = nil
    }
}
