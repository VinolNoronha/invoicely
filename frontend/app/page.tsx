import { Fjalla_One, Noto_Sans_Javanese } from "next/font/google";
import Image from "next/image";
import Logo from "@/public/invoicelylogo.png";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

const fjalla_one = Fjalla_One({
  weight: "400",
  subsets: ["latin"],
});

const noto_sans_javanese = Noto_Sans_Javanese({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <header className=" h-16 w-full  flex items-center gap-2">
        <div className="flex flex-row justify-center items-center gap-2 ml-10 mr-210">
          <Image
            className="rounded-md flex-none"
            height={40}
            width={40}
            alt="logo"
            src={Logo}
          />
          <h1 className={`${fjalla_one.className} text-2xl w-64 flex-1`}>
            Invoicely
          </h1>
        </div>
        <Link href="auth/signup">
          <button className=" text-black-900 px-4 py-1 rounded-md font-extrabold">
            Sign up
          </button>
        </Link>
        <Link href="auth/signin">
          <button className="bg-black text-white px-4 py-1 rounded-md hover:bg-gray-800 transition">
            Log in
          </button>
        </Link>
      </header>
      <main>
        <section className="bg-yellow-30 h-100 w-full">
          <section className=" flex flex-col h-90 items-center justify-center ">
            <div className="w-1/2 flex ">
              <h4
                className={`${noto_sans_javanese.className} text-5xl leading-[1.2] `}
              >
                Welcome to{" "}
                <span className="text-blue-700 font-extrabold">Invoicely</span>{" "}
                this is where your invoices are managed{" "}
                <span className="underline decoration-blue-600">
                  effortlessly
                </span>
              </h4>
            </div>
            <div className="w-1/2">
              <Link href="auth/signin">
                <button className="bg-black text-white px-7 py-3 rounded-md hover:bg-gray-800 transition flex">
                  Get started <ArrowRightIcon className="h-6 w-10" />
                </button>
              </Link>
            </div>
          </section>
          <section className="boder h-full w-full bg-yellow-30 flex gap-20 justify-center items-center">
            <div className="h-80 w-70 bg-gray-100 rounded-md"></div>
            <div className="h-80 w-70 bg-gray-100 rounded-md"></div>
            <div className="h-80 w-70 bg-gray-100 rounded-md"></div>
          </section>
        </section>
      </main>
    </>
  );
}
