import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="o-grid !gap-y-24">
      <Header className="col-span-full" />
      <main className="col-span-full o-grid grid-cols-subgrid !gap-y-24">
        {children}
      </main>
      <Footer className="col-span-full" />
      <ChatbotWidget />
    </div>
  );
}
