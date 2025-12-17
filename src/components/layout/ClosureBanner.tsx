import { CalendarFoldIcon } from "lucide-react";
import { getPublicClosures } from "@/lib/appointments";
import type { PublicClosure } from "@/types/appointments";

// Format the closure message
function formatClosureMessage(closure: PublicClosure) {
  const reasonText = closure.reason ? ` (${closure.reason})` : "";

  if (closure.end_date && closure.end_date !== closure.start_date) {
    const startDate = new Date(closure.start_date);
    const endDate = new Date(closure.end_date);
    const sameMonth =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    if (sameMonth) {
      // Same month: "van 6 t/m 12 dec"
      const day1 = startDate.getDate();
      const day2 = endDate.getDate();
      const month = endDate.toLocaleDateString("nl-NL", { month: "short" });
      return {
        prefix: closure.is_closed
          ? "Wij zijn gesloten"
          : "Aangepaste openingsuren",
        dateRange: `van ${day1} t/m ${day2} ${month}`,
        suffix: reasonText,
      };
    } else {
      // Different months: "6 dec tot en met 1 jan"
      const formatShort = (d: Date) =>
        d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
      return {
        prefix: closure.is_closed
          ? "Wij zijn gesloten van"
          : "Aangepaste openingsuren van",
        startDate: formatShort(startDate),
        endDate: formatShort(endDate),
        suffix: reasonText,
      };
    }
  }

  // Single day
  const date = new Date(closure.start_date);
  const formatted = date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
  return {
    prefix: closure.is_closed
      ? "Wij zijn gesloten op"
      : "Aangepaste openingsuren op",
    startDate: formatted,
    endDate: null,
    suffix: reasonText,
  };
}

export async function ClosureBanner() {
  let closures: PublicClosure[] = [];

  try {
    const overrides = await getPublicClosures();
    closures = overrides.map((override) => ({
      id: override.id,
      start_date: override.date,
      end_date: override.end_date,
      is_closed: override.is_closed,
      reason: override.reason,
      is_recurring: override.is_recurring,
    }));
  } catch (error) {
    console.error("Failed to fetch closures:", error);
    return null;
  }

  // Don't render if no closures
  if (closures.length === 0) {
    return null;
  }

  // Get the most relevant closure (first one, sorted by date)
  const closure = closures[0];
  const message = formatClosureMessage(closure);

  return (
    <div className="bg-accent-dark text-white/80 text-sm">
      <div className="o-grid">
        <div className="col-span-full flex items-center justify-center gap-2 py-2.5">
          <CalendarFoldIcon className="text-white size-4 shrink-0" />
          <span>
            {message.prefix}{" "}
            {"dateRange" in message ? (
              <span className="font-medium text-white">{message.dateRange}</span>
            ) : (
              <>
                <span className="font-medium text-white">
                  {message.startDate}
                </span>
                {message.endDate && (
                  <>
                    {" "}
                    tot en met{" "}
                    <span className="font-medium text-white">
                      {message.endDate}
                    </span>
                  </>
                )}
              </>
            )}
            {message.suffix}
          </span>
          {closures.length > 1 && (
            <span className="text-white/70">(+{closures.length - 1} meer)</span>
          )}
        </div>
      </div>
    </div>
  );
}
