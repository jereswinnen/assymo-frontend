import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircleIcon, CalendarPlusIcon, HomeIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Afspraak geannuleerd | Assymo",
  description: "Uw afspraak is geannuleerd.",
};

export default function AppointmentCancelledPage() {
  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-start-2 col-end-8 py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6">
            <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="size-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Afspraak geannuleerd</h1>
            <p className="text-muted-foreground">
              Uw afspraak is succesvol geannuleerd. U ontvangt een
              bevestigingsmail van de annulering.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground">
              Wilt u toch nog een afspraak maken? U bent altijd welkom om een
              nieuwe afspraak in te plannen via onderstaande knop.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/afspraak">
                <CalendarPlusIcon className="size-4" />
                Nieuwe afspraak maken
              </Link>
            </Button>
            <Button variant="outline" asChild>
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
