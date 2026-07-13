import classNames from "classnames";

type Props = {
  size?: "large" | "small";
  name: string;
  isPending: boolean;
  isRegistered: boolean;
};

export const NameStatusCard = ({
  size = "large",
  name,
  isPending,
  isRegistered,
}: Props) => (
  <a
    href={`https://app.ens.domains/name/${encodeURIComponent(`${name}.eth`)}`}
    target="_blank"
    rel="noreferrer"
    className={classNames(
      "flex items-center justify-center leading-none rounded-xl hover:opacity-100 transition",
      size === "large" ? "p-8" : "p-4",
      (() => {
        if (isPending) {
          return "animate-pulse";
        }
        if (isRegistered) {
          return "opacity-50 hover:bg-red-400 hover:bg-opacity-50";
        }
        return "bg-green-400 bg-opacity-50 hover:bg-opacity-80";
      })()
    )}
  >
    <span className={size === "large" ? "text-5xl" : "font-bold"}>{name}</span>
    <span>.eth</span>
  </a>
);
