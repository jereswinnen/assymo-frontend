import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatbotWrapper from "@/components/ChatbotWrapper";
import CookieBanner from "@/components/CookieBanner";
import { ClosureBanner } from "@/components/ClosureBanner";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-y-4">
      <ClosureBanner />
      <div className="flex flex-col gap-y-10 md:gap-y-24">
        <Header />
        <main className="o-grid grid-cols-subgrid gap-y-18! md:gap-y-30!">
          {children}
        </main>
        <Footer />
        <ChatbotWrapper />
        <CookieBanner />
      </div>
      <SpeedInsights />
    </div>
  );
}
