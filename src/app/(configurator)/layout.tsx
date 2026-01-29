import { Instrument_Sans } from "next/font/google";
import { OpenPanelComponent } from "@openpanel/nextjs";
import "../globals.css";
import { getSiteParameters } from "@/lib/content";
import { ConfiguratorHeader } from "@/components/configurator/ConfiguratorHeader";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export default async function ConfiguratorRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const parameters = await getSiteParameters();

  return (
    <html lang="nl">
      <body className={`${instrumentSans.variable} font-sans antialiased`}>
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
          trackScreenViews={true}
        />
        <main className="o-grid--configurator">
          <div className="o-grid--configurator__sidebar" />
          <section className="flex flex-col gap-y-12! md:gap-y-20! overflow-hidden">
            <ConfiguratorHeader phone={parameters?.phone ?? undefined} />
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}
