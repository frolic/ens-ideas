"use client";

import names from "../emoji.json";
import { Header } from "../Header";
import { useBulkAvailability } from "../useBulkAvailability";
import { NameStatusCard } from "../NameStatusCard";

export const EmojiChecker = () => {
  const { value, loading } = useBulkAvailability(names);
  return (
    <div className="w-screen min-h-screen flex flex-col bg-indigo-400 text-indigo-900 sm:pt-12 px-4 sm:px-12 pb-40 space-y-12">
      <Header />
      <div>
        <h1 className="text-4xl font-medium leading-tight">
          Available emoji .eth domains
        </h1>
        <p className="text-lg text-indigo-700">
          There are {names.length.toLocaleString()} emojis that are considered
          valid ENS names.{" "}
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
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <NameStatusCard
            key={name}
            name={name}
            isPending={loading || !value}
            isRegistered={value ? value.includes(name) : false}
          />
        ))}
      </div>
    </div>
  );
};
