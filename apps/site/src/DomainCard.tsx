import { useEffect, useState } from "react";
import classNames from "classnames";
// @ts-ignore
import { normalize } from "@ensdomains/eth-ens-namehash";
import { RelativeTime } from "./RelativeTime";
import { DateTime } from "luxon";
import { useRegistration } from "./useRegistration";

type Props = {
  name: string;
};

export const DomainCard = ({ name }: Props) => {
  const [normalizedName, setNormalizedName] = useState("");

  // TODO: move normalization into useRegistration?
  useEffect(() => {
    try {
      setNormalizedName(
        normalize(
          name
            .replace(/[\s\\'!"#$%&()*+,.\/:;<=>?@\[\]^_`{|}~]/g, "")
            .replace(/^-+|-+$/g, "")
        )
      );
    } catch (error) {}
  }, [name]);

  const { isRegistered, registration, error, fetching } =
    useRegistration(normalizedName);

  if (!normalizedName) return null;

  const url = `https://app.ens.domains/name/${encodeURIComponent(
    `${normalizedName}.eth`
  )}`;

  const expiryDate = registration
    ? DateTime.fromSeconds(+registration.expiryDate)
    : null;
  const isExpired = expiryDate ? expiryDate.diffNow().toMillis() < 0 : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={classNames(
        "block p-6 rounded-xl hover:translate-x-1 text-white transition",
        (() => {
          if (normalizedName && !fetching && isRegistered === true) {
            if (isExpired) {
              return "bg-orange-600 bg-opacity-80 hover:bg-orange-700 hover:bg-opacity-80";
            }
            return "bg-red-600 bg-opacity-80 hover:bg-red-700 hover:bg-opacity-80";
          }
          if (normalizedName && !fetching && isRegistered === false) {
            return "bg-green-700 bg-opacity-80 hover:bg-green-800 hover:bg-opacity-80";
          }
          return "animate-pulse opacity-70";
        })()
      )}
    >
      <span className="flex gap-4 justify-between text-3xl sm:text-4xl font-semibold">
        <span className="group-hover:underline">{normalizedName}.eth</span>
        <span>&rarr;</span>
      </span>
      {registration ? (
        <span className="block opacity-80">
          registered{" "}
          <RelativeTime
            date={DateTime.fromSeconds(+registration.registrationDate)}
          />
          , {isExpired ? "expired" : "expires"}{" "}
          <RelativeTime date={DateTime.fromSeconds(+registration.expiryDate)} />
        </span>
      ) : null}
    </a>
  );
};
