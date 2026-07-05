import AppHeader from "@/components/AppHeader";
import FlashCards from "@/components/flash-cards/FlashCards";

type FlashCardsPageProps = {
  userName: string | null;
};

function FlashCardsPage({ userName }: FlashCardsPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <section className="relative mx-auto w-full max-w-5xl space-y-5">
        <AppHeader userName={userName} subtitle="英会話フラッシュカード" />
        <FlashCards />
      </section>
    </main>
  );
}

export default FlashCardsPage;
