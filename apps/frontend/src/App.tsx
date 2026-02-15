import PronunciationAssessment from "./components/PronunciationAssessment";

function App() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <div className="absolute -top-24 left-[-4%] h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute top-18 right-[-6%] h-96 w-96 rounded-full bg-cyan-300/28 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[42%] h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-6xl space-y-4">
        <header className="space-y-4 text-left">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center justify-start gap-5">
              <img
                src="/app_icon.png"
                alt="re-say icon"
                className="h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/10"
              />
              <span className="text-balance text-[clamp(1.3rem,3.2vw,2.25rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                re-say!
              </span>
            </div>
            <p className="text-[clamp(0.8rem,1.8vw,1.1rem)] font-light text-slate-600 dark:text-slate-300">
              英語発音練習アプリ
            </p>
          </div>
        </header>
        <PronunciationAssessment />
      </section>
    </main>
  );
}

export default App;
