import { useQuery, gql } from "urql";
import { DateTime } from "luxon";

// TODO: figure out how to generate/extract types from this query

const RegistrationQuery = gql`
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
//
// We set this up here so that `useQuery` can cache for the duration of the session.
const earliestExpiry = Math.floor(
  DateTime.now().minus({ days: 90 }).toSeconds()
);

export const useRegistration = (name: string) => {
  const isValid = name.length >= 3;

  const [result, reexecuteQuery] = useQuery({
    query: RegistrationQuery,
    variables: { name, earliestExpiry },
    pause: !isValid,
  });

  if (!isValid) {
    return { data: null, error: null, fetching: false, isRegistered: true };
  }

  const { data, error, fetching } = result;

  return {
    data,
    error,
    fetching,
    registration: data?.registrations[0],
    isRegistered: data ? data.registrations.length > 0 : null,
  };
};
