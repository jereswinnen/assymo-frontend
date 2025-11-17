import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid gap-y-14">
      <Header />
      <main className="col-span-full o-grid grid-cols-subgrid gap-y-14">
        {children}
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
