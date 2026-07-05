import AppHeader from "@/components/AppHeader";
import PronunciationAssessment from "@/components/PronunciationAssessment";

type AppPageProps = {
  userName: string | null;
};

function AppPage({ userName }: AppPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <div className="absolute -top-24 left-[-4%] h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute top-18 right-[-6%] h-96 w-96 rounded-full bg-cyan-300/28 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[42%] h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-6xl space-y-4">
        <AppHeader userName={userName} subtitle="英語発音練習アプリ" />
        <PronunciationAssessment />
      </section>
    </main>
  );
}

export default AppPage;
