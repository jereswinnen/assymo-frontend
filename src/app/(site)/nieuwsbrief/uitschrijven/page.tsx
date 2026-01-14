import { unsubscribeContact } from "@/lib/newsletter";
import Link from "next/link";
import { buildMetadata } from "@/lib/getPageMetadata";

export const metadata = buildMetadata({
  title: "Uitschrijven",
  description: "Schrijf u uit van de Assymo nieuwsbrief",
  path: "/nieuwsbrief/uitschrijven",
});

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <UnsubscribeLayout status="error">
        <h1>Ongeldige link</h1>
        <p>
          Deze uitschrijflink is ongeldig of verlopen. Neem contact met ons op
          als u zich wilt uitschrijven.
        </p>
      </UnsubscribeLayout>
    );
  }

  const result = await unsubscribeContact(id);

  if (!result.success) {
    return (
      <UnsubscribeLayout status="error">
        <h1>Er ging iets mis</h1>
        <p>{result.error}</p>
      </UnsubscribeLayout>
    );
  }

  return (
    <UnsubscribeLayout status="success">
      <h1>U bent uitgeschreven</h1>
      <p>
        U ontvangt geen nieuwsbrieven meer van Assymo. Mocht u zich bedenken,
        dan kunt u zich altijd opnieuw inschrijven via onze website.
      </p>
    </UnsubscribeLayout>
  );
}

function UnsubscribeLayout({
  children,
  status,
}: {
  children: React.ReactNode;
  status: "success" | "error";
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div
          className={`mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full ${
            status === "success" ? "bg-accent-light/20" : "bg-red-100"
          }`}
        >
          {status === "success" ? (
            <svg
              className="w-8 h-8 text-accent-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        <div className="space-y-4 mb-8">{children}</div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-accent-light text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Naar de homepage
        </Link>
      </div>
    </div>
  );
}
