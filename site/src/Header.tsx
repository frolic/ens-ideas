"use client";

import { Link, useRouter } from "waku";

export const Header = () => {
  const router = useRouter();
  return (
    <div className="flex flex-wrap justify-between items-end">
      <Link
        to="/"
        className="text-xl text-white font-semibold bg-indigo-500 px-3 py-1 rounded-b-xl sm:rounded-t-xl"
      >
        ENS Ideas 🤔
      </Link>
      <Link
        to="/about"
        className="font-bold text-indigo-900 hover:underline"
        hidden={router.path === "/about"}
      >
        API docs &rarr;
      </Link>
    </div>
  );
};
