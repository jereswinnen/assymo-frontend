import { getAppointmentSettings } from "@/lib/appointments/queries";
import { DAYS_OF_WEEK } from "@/types/appointments";
import { ClockIcon } from "lucide-react";

/**
 * Format time from "HH:MM:SS" or "HH:MM" to "HH:MM"
 */
function formatTime(time: string | null): string {
  if (!time) return "";
  return time.substring(0, 5);
}

/**
 * Server component that displays business opening hours
 */
export default async function OpeningHoursDisplay() {
  const settings = await getAppointmentSettings();

  // Group consecutive days with same hours
  const groupedHours: {
    days: string[];
    hours: string;
  }[] = [];

  for (const day of DAYS_OF_WEEK) {
    const setting = settings.find((s) => s.day_of_week === day.value);
    const hours = setting?.is_open
      ? `${formatTime(setting.open_time)} - ${formatTime(setting.close_time)}`
      : "Gesloten";

    const lastGroup = groupedHours[groupedHours.length - 1];
    if (lastGroup && lastGroup.hours === hours) {
      // Add to existing group
      lastGroup.days.push(day.shortName);
    } else {
      // Start new group
      groupedHours.push({
        days: [day.shortName],
        hours,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="mb-0! text-stone-900">Openingsuren kantoor</h3>
      <ul className="flex flex-col gap-1 text-sm text-stone-600">
        {groupedHours.map((group, index) => (
          <li key={index} className="flex justify-between gap-4">
            <span className="text-stone-700">
              {group.days.length === 1
                ? group.days[0]
                : `${group.days[0]} - ${group.days[group.days.length - 1]}`}
            </span>
            <span
              className={
                group.hours === "Gesloten" ? "text-stone-500" : "text-stone-700"
              }
            >
              {group.hours}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
