import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = MeterAnalysisViewModel()
    @FocusState private var isEditorFocused: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .trailing, spacing: 20) {
                    header

                    inputSection

                    analyzeButton

                    if let result = viewModel.result {
                        AnalysisResultView(
                            result: result,
                            showsDeveloperDiagnostics: AppConfig.buildConfiguration.showsDeveloperDiagnostics
                        )
                        .transition(.opacity)
                    }
                }
                .padding()
                .animation(.default, value: viewModel.result)
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(AppConfig.appName)
            .navigationBarTitleDisplayMode(.large)
        }
        .environment(\.layoutDirection, .rightToLeft)
    }

    private var header: some View {
        Text("اكتب بيتك الشعري")
            .font(.title3.weight(.semibold))
            .frame(maxWidth: .infinity, alignment: .trailing)
    }

    private var inputSection: some View {
        TextEditor(text: $viewModel.inputText)
            .focused($isEditorFocused)
            .multilineTextAlignment(.trailing)
            .frame(minHeight: 120, maxHeight: 220)
            .padding(8)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(alignment: .topTrailing) {
                if viewModel.inputText.isEmpty {
                    Text("مثال: يا ما بنيت القصر وأعليت جدرانه")
                        .foregroundStyle(.tertiary)
                        .padding(16)
                        .allowsHitTesting(false)
                }
            }
            .accessibilityLabel("حقل إدخال بيت الشعر")
            .accessibilityHint("اكتب بيتًا شعريًا نبطيًا لتحليل وزنه")
    }

    private var analyzeButton: some View {
        Button {
            isEditorFocused = false
            viewModel.analyze()
        } label: {
            HStack {
                if viewModel.isAnalyzing {
                    ProgressView()
                        .tint(.white)
                }
                Text("زن البيت")
                    .font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 48)
        }
        .buttonStyle(.borderedProminent)
        .disabled(!viewModel.canAnalyze)
        .accessibilityHint("يحلّل البيت المُدخَل ويعرض البحر والتفعيلات والتقطيع")
    }
}

#Preview {
    HomeView()
}
