import PronunciationAssessment from "./components/PronunciationAssessment";

function App() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/app_icon.png" alt="re-say icon" className="h-12 w-12 rounded-xl shadow-md ring-1 ring-black/10" />
            <span className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">re-say</span>
          </div>
          <p className="inline-flex rounded-full border border-orange-400/40 bg-orange-100/60 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-orange-700 uppercase dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-200">
            Pronunciation Studio
          </p>
          <h1 className="text-balance text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Train Your Voice, Measure Your Clarity
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
            Record a phrase and get instant scoring for accuracy, fluency, completeness, and prosody.
          </p>
        </header>
        <PronunciationAssessment />
      </section>
    </main>
  );
}

export default App;
