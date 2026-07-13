import { useRouter } from "next/router";
import Link from "next/link";

export const Header = () => {
  const router = useRouter();
  return (
    <div className="flex flex-wrap justify-between items-end">
      <Link href="/">
        <a className="text-xl text-white font-semibold bg-indigo-500 px-3 py-1 rounded-b-xl sm:rounded-t-xl">
          ENS Ideas 🤔
        </a>
      </Link>
      <Link href="/about">
        <a
          className="font-bold text-indigo-900 hover:underline"
          hidden={router.asPath === "/about"}
        >
          API docs &rarr;
        </a>
      </Link>
    </div>
  );
};
