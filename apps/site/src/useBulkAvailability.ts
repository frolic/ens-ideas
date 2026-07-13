import { graph } from "./urql";
import { gql } from "urql";
import { DateTime } from "luxon";
import useAsync from "react-use/lib/useAsync"; // https://github.com/streamich/react-use/pull/2101
import chunk from "lodash/chunk";
import flatten from "lodash/flatten";

const BulkRegistrationQuery = gql`
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
//
// We set this up here so that `useQuery` can cache for the duration of the session.
const earliestExpiry = Math.floor(
  DateTime.now().minus({ days: 90 }).toSeconds()
);

export const useBulkAvailability = (names: string[]) => {
  return useAsync(async (): Promise<string[]> => {
    return flatten(
      await Promise.all(
        chunk(names, 100).map(async (namesChunk) => {
          const { data } = await graph
            .query(BulkRegistrationQuery, {
              names: namesChunk,
              earliestExpiry,
            })
            .toPromise();
          const registrations = data.registrations.map(
            (registration: any) => registration.labelName
          );
          return registrations;
        })
      )
    );
  });
};
