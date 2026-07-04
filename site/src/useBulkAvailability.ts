"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { queryGraph } from "./lib/graph";

const BulkRegistrationQuery = `
  query BulkRegistrationQuery($names: [String!]!, $earliestExpiry: Int!) {
    registrations(
      where: { labelName_in: $names, expiryDate_gt: $earliestExpiry }
    ) {
      labelName
      registrationDate
      expiryDate
    }
  }
`;

// Registrations subgraph includes expired domains, but we can filter them out
// with an `expiryDate` filter to account for the 90 day grace period.
const earliestExpiry = Math.floor(
  DateTime.now().minus({ days: 90 }).toSeconds()
);

const chunk = <item>(items: item[], size: number): item[][] => {
  const chunks: item[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const useBulkAvailability = (names: string[]) => {
  const [value, setValue] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(
      chunk(names, 100).map(async (namesChunk) => {
        const data = await queryGraph(BulkRegistrationQuery, {
          names: namesChunk,
          earliestExpiry,
        });
        return data.registrations.map(
          (registration: { labelName: string }) => registration.labelName
        ) as string[];
      })
    )
      .then((results) => {
        if (cancelled) return;
        setValue(results.flat());
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { value, loading };
};
