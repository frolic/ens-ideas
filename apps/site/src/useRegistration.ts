"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { queryGraph } from "./lib/graph";

const RegistrationQuery = `
  query RegistrationQuery($name: String!, $earliestExpiry: Int!) {
    registrations(
      where: { labelName: $name, expiryDate_gt: $earliestExpiry }
      first: 1
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

type Registration = {
  labelName: string;
  registrationDate: string;
  expiryDate: string;
};

export const useRegistration = (name: string) => {
  const isValid = name.length >= 3;

  const [data, setData] = useState<{ registrations: Registration[] } | null>(
    null
  );
  const [error, setError] = useState<unknown>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setData(null);
      setError(null);
      setFetching(false);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setError(null);

    queryGraph(RegistrationQuery, { name, earliestExpiry })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setFetching(false);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught);
        setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, isValid]);

  if (!isValid) {
    return { data: null, error: null, fetching: false, isRegistered: true };
  }

  return {
    data,
    error,
    fetching,
    registration: data?.registrations[0],
    isRegistered: data ? data.registrations.length > 0 : null,
  };
};
