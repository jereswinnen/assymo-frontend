import { Instrument_Sans } from "next/font/google";
import { OpenPanelComponent } from "@openpanel/nextjs";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
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
        {children}
      </body>
    </html>
  );
}
