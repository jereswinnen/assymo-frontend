import { Instrument_Sans } from "next/font/google";
import { OpenPanelComponent } from "@openpanel/nextjs";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatbotWrapper from "@/components/chatbot/ChatbotWrapper";
import CookieBanner from "@/components/cookies/CookieBanner";
import { ClosureBanner } from "@/components/layout/ClosureBanner";
import "../globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${instrumentSans.variable} font-sans antialiased`}>
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
          trackScreenViews={true}
        />
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
      </body>
    </html>
  );
}
