"use client";

import { Header } from "../Header";
import { useBulkAvailability } from "../useBulkAvailability";
import { NameStatusCard } from "../NameStatusCard";

const names = new Array(1000).fill(null).map((_, i) => `${i}`.padStart(3, "0"));

export const ThreeNumbers = () => {
  const { value, loading } = useBulkAvailability(names);
  return (
    <div className="w-screen min-h-screen flex flex-col bg-indigo-400 text-indigo-900 sm:pt-12 px-4 sm:px-12 pb-40 space-y-12">
      <Header />
      <div>
        <h1 className="text-4xl font-medium leading-tight">
          Available three-number .eth domains
        </h1>
        <p className="text-lg text-indigo-700">
          There are {names.length.toLocaleString()} possible three-number ENS
          names.{" "}
          {value ? (
            <>
              <span className="pb-1 border-b-4 border-green-400 border-opacity-50">
                {(names.length - value.length).toLocaleString()} of them are
                available!
              </span>{" "}
              👀
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 font-mono">
        {names.map((name) => (
          <NameStatusCard
            key={name}
            size="small"
            name={name}
            isPending={loading || !value}
            isRegistered={value ? value.includes(name) : false}
          />
        ))}
      </div>
    </div>
  );
};
