// import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatbotWrapper from "@/components/chatbot/ChatbotWrapper";
import CookieBanner from "@/components/cookies/CookieBanner";
import { ClosureBanner } from "@/components/layout/ClosureBanner";

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
      {/*<SpeedInsights />*/}
    </div>
  );
}
