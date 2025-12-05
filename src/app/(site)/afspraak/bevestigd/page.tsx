import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, CalendarIcon, HomeIcon } from "lucide-react";
import { APPOINTMENTS_CONFIG } from "@/config/appointments";

export const metadata: Metadata = {
  title: "Afspraak bevestigd | Assymo",
  description: "Uw afspraak is succesvol ingepland.",
};

export default function AppointmentConfirmedPage() {
  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-start-2 col-end-8 py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="size-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Afspraak bevestigd!</h1>
            <p className="text-muted-foreground">
              Uw afspraak is succesvol ingepland. U ontvangt binnen enkele
              minuten een bevestigingsmail met alle details.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold mb-3">Wat kunt u verwachten?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent-dark mt-1">•</span>
                U ontvangt een bevestigingsmail met een link om uw afspraak te
                bekijken, wijzigen of annuleren
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-dark mt-1">•</span>
                In de mail vindt u ook een kalenderbestand (.ics) dat u kunt
                toevoegen aan uw agenda
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-dark mt-1">•</span>
                Bij vragen kunt u ons altijd bereiken via telefoon of e-mail
              </li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3">
              <CalendarIcon className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium">Locatie</h3>
                <p className="text-sm text-muted-foreground">
                  {APPOINTMENTS_CONFIG.storeLocation}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <HomeIcon className="size-4" />
                Terug naar home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
