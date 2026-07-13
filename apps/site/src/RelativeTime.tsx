import { DateTime } from "luxon";
import { useEffect, useState } from "react";

type Props = {
  date: DateTime;
};

export const RelativeTime = ({ date }: Props) => {
  const [relativeTime, setRelativeTime] = useState(date.toRelative());

  useEffect(() => {
    const timer = setInterval(() => {
      const nextRelativeTime = date.toRelative();
      // React will re-render on any `setState` call and doesn't take into account equality
      // so we'll check for it here before updating state.
      if (nextRelativeTime !== relativeTime) {
        setRelativeTime(nextRelativeTime);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  });

  return (
    <span title={date.toLocaleString(DateTime.DATETIME_FULL)}>
      {relativeTime}
    </span>
  );
};
