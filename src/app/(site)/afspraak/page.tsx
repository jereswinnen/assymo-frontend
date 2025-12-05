import { Metadata } from "next";
import { AppointmentBookingForm } from "@/components/appointments/AppointmentBookingForm";

export const metadata: Metadata = {
  title: "Maak een afspraak | Assymo",
  description:
    "Plan een bezoek aan onze toonzaal. Bekijk onze tuinhuizen, carports en bijgebouwen en ontvang persoonlijk advies.",
};

export default function AppointmentPage() {
  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-start-2 col-end-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Maak een afspraak
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Plan een bezoek aan onze toonzaal voor persoonlijk advies over uw
            tuinhuis, carport of bijgebouw.
          </p>
        </div>

        <AppointmentBookingForm />
      </div>
    </section>
  );
}
