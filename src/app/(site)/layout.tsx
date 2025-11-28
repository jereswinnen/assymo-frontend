import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-y-10 md:gap-y-24">
      <Header />
      <main className="o-grid grid-cols-subgrid gap-y-18! md:gap-y-24!">
        {children}
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
