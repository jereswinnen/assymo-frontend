"use client";

import { ExternalLinkIcon, MailIcon } from "lucide-react";
import type { Newsletter } from "@/config/newsletter";

interface BroadcastHistoryProps {
  newsletters: Newsletter[];
}

export function BroadcastHistory({ newsletters }: BroadcastHistoryProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("nl-BE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Verzonden nieuwsbrieven</h3>
        <p className="text-sm text-muted-foreground">
          Bekijk je verzonden nieuwsbrieven en statistieken in Resend
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Onderwerp</th>
              <th className="px-4 py-3 text-left font-medium">Verzonden</th>
              <th className="px-4 py-3 text-left font-medium">Abonnees</th>
              <th className="px-4 py-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {newsletters.map((newsletter) => (
              <tr key={newsletter.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[250px]">
                      {newsletter.subject || "(Geen onderwerp)"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(newsletter.sentAt)}
                </td>
                <td className="px-4 py-3">
                  {newsletter.subscriberCount ?? "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  {newsletter.resendEmailId && (
                    <a
                      href={`https://resend.com/emails/${newsletter.resendEmailId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Bekijk in Resend
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
