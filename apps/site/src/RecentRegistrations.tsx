import { useRecentRegistrations } from "./useRecentRegistrations";
import { RelativeTime } from "./RelativeTime";
import { DateTime } from "luxon";

const toYears = (from: DateTime, to: DateTime): string => {
  const seconds = to.toSeconds() - from.toSeconds();
  const years = Math.round(seconds / (60 * 60 * 24 * 365));
  return years === 1 ? "1 year" : `${years} years`;
};

export const RecentRegistrations = () => {
  const recentRegistrations = useRecentRegistrations();

  return (
    <div className="overflow-hidden space-y-1 text-indigo-700 relative">
      {recentRegistrations.map((registration) => (
        <div key={registration.name}>
          <a
            href={`https://app.ens.domains/name/${encodeURIComponent(
              registration.name
            )}`}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-900 font-bold hover:underline"
          >
            {registration.name}
          </a>{" "}
          <span>
            <span className="hidden sm:inline">was registered</span> for{" "}
            {toYears(registration.registrationDate, registration.expiryDate)}
          </span>{" "}
          ✨{" "}
          <span className="hidden sm:inline opacity-40 px-2">
            <RelativeTime date={registration.registrationDate} />
          </span>
        </div>
      ))}
      <div className="fixed left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-indigo-400 pointer-events-none"></div>
    </div>
  );
};
