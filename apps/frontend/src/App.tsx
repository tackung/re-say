import PronunciationAssessment from "./components/PronunciationAssessment";

function App() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <div className="absolute -top-24 left-[-4%] h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute top-18 right-[-6%] h-96 w-96 rounded-full bg-cyan-300/28 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[42%] h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/app_icon.png" alt="re-say icon" className="h-12 w-12 rounded-2xl shadow-md ring-1 ring-black/10" />
            <span className="text-2xl font-bold tracking-wide text-slate-900 dark:text-slate-100">re-say</span>
          </div>
          <h1 className="text-balance text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            Speak Better With Curated Contexts
          </h1>
        </header>
        <PronunciationAssessment />
      </section>
    </main>
  );
}

export default App;
