"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { queryGraph } from "./lib/graph";

const RecentRegistrationsQuery = `
  query RecentRegistrationsQuery {
    registrations(first: 100, orderBy: registrationDate, orderDirection: desc) {
      registrationDate
      expiryDate
      domain {
        name
      }
    }
  }
`;

type Registration = {
  name: string;
  registrationDate: DateTime;
  expiryDate: DateTime;
};

type RawRegistration = {
  registrationDate: string;
  expiryDate: string;
  domain: { name: string };
};

export const useRecentRegistrations = (): Registration[] => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchRegistrations = async () => {
      const data = await queryGraph(RecentRegistrationsQuery);
      if (cancelled || !data) return;
      setRegistrations(
        data.registrations.map((registration: RawRegistration) => ({
          name: registration.domain.name,
          registrationDate: DateTime.fromSeconds(
            +registration.registrationDate
          ),
          expiryDate: DateTime.fromSeconds(+registration.expiryDate),
        }))
      );
    };

    fetchRegistrations();
    const timer = setInterval(fetchRegistrations, 1000 * 5);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return registrations;
};
