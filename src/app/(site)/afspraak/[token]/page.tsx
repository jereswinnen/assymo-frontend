import { Metadata } from "next";
import { AppointmentView } from "./AppointmentView";

export const metadata: Metadata = {
  title: "Uw afspraak | Assymo",
  description: "Bekijk, wijzig of annuleer uw afspraak.",
};

interface AppointmentTokenPageProps {
  params: Promise<{ token: string }>;
}

export default async function AppointmentTokenPage({
  params,
}: AppointmentTokenPageProps) {
  const { token } = await params;

  return (
    <section className="col-span-full grid grid-cols-subgrid">
      <div className="col-start-2 col-end-8 py-8">
        <AppointmentView token={token} />
      </div>
    </section>
  );
}
