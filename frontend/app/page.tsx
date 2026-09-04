import { Fjalla_One, Noto_Sans_Javanese } from "next/font/google";
import Image from "next/image";
import Logo from "@/public/invoicelylogo.png";
import Ocrimage from "@/public/ocrfeature.png";
import gst2b_reconsi from "@/public/gst2b_reconsi.png";
import cashflow from "@/public/cashflow.png";
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
      <header className="h-16 w-full flex items-center justify-between gap-2 px-4 sm:px-0">
        <div className="flex flex-row justify-center items-center gap-2 sm:ml-10">
          <Image
            className="rounded-md flex-none"
            height={40}
            width={40}
            alt="logo"
            src={Logo}
          />
          <h1
            className={`${fjalla_one.className} text-xl sm:text-2xl w-auto sm:w-64 flex-1`}
          >
            Invoicely
          </h1>
        </div>
        <div className="flex gap-2  sm:mr-5">
          <Link href="auth/signup">
            <button className="text-black-900 px-3 py-1 rounded-md font-extrabold text-sm sm:text-base">
              Sign up
            </button>
          </Link>
          <Link href="auth/signin">
            <button className="bg-black text-white px-3 py-1 rounded-md hover:bg-gray-800 transition text-sm sm:text-base">
              Log in
            </button>
          </Link>
        </div>
      </header>
      <main>
        <section className="bg-yellow-30 w-full">
          <section className="flex flex-col h-auto py-10 sm:py-0 sm:h-90 items-center justify-center px-4 sm:px-0">
            <div className="w-full sm:w-1/2 flex flex-col">
              <h4
                className={`${noto_sans_javanese.className} text-2xl sm:text-5xl leading-[1.2] text-left px-10`}
              >
                Transform your billing with{" "}
                <span className="text-blue-700 font-extrabold">Invoicely</span>{" "}
                — instant OCR & GSTR-2B matching{" "}
                <span className="underline decoration-blue-600">
                  in seconds
                </span>
              </h4>
            </div>
            <div className="w-full px-10 sm:w-1/2 flex mt-6">
              <Link href="auth/signin">
                <button className="bg-black text-white px-5 py-2 sm:px-7 sm:py-3 rounded-md hover:bg-gray-800 transition flex items-center gap-2">
                  Get started{" "}
                  <ArrowRightIcon className="h-5 w-8 sm:h-6 sm:w-10" />
                </button>
              </Link>
            </div>
          </section>
          <section className=" h-full w-full bg-yellow-30 flex flex-col sm:flex-row gap-6 sm:gap-20 justify-center items-center px-4 py-10 sm:py-0">
            <div className="h-60 w-full sm:h-70 sm:w-75 bg-white rounded-md shadow-lg border border-blue-100">
              <div className="h-full w-full flex flex-col items-center py-3">
                <div className="h-[70%] w-[93%] overflow-hidden relative rounded-sm border-2 border-blue-200">
                  <Image
                    className="object-cover"
                    alt="OCR feature"
                    src={Ocrimage}
                    fill
                    sizes="(max-width: 640px) 100vw, 18.75rem"
                  />
                </div>

                <div className="mt-3 rounded-sm h-[20%] w-[93%] bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <text
                    className={`${noto_sans_javanese.className} text-xs px-4 text-center font-semibold text-blue-700`}
                  >
                    Smart Document Parsing
                  </text>
                </div>
              </div>
            </div>
            <div className="h-60 w-full sm:h-70 sm:w-75 bg-white rounded-md shadow-lg border border-blue-100">
              <div className="h-full w-full flex flex-col items-center py-3">
                <div className="h-[70%] w-[93%] overflow-hidden relative rounded-sm border-2 border-blue-200">
                  <Image
                    className="object-cover"
                    alt="OCR feature"
                    src={gst2b_reconsi}
                    fill
                    sizes="(max-width: 640px) 100vw, 18.75rem"
                  />
                </div>

                <div className="mt-3 rounded-sm h-[20%] w-[93%] bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <text
                    className={`${noto_sans_javanese.className} text-xs px-4 text-center font-semibold text-blue-700`}
                  >
                    Automated GSTR-2B Reconciliation
                  </text>
                </div>
              </div>
            </div>
            <div className="h-60 w-full sm:h-70 sm:w-75 bg-white rounded-md shadow-lg border border-blue-100">
              <div className="h-full w-full flex flex-col items-center py-3">
                <div className="h-[70%] w-[93%] overflow-hidden relative rounded-sm border-2 border-blue-200">
                  <Image
                    className="object-cover"
                    alt="OCR feature"
                    src={cashflow}
                    fill
                    sizes="(max-width: 640px) 100vw, 18.75rem"
                  />
                </div>

                <div className="mt-3 rounded-sm h-[20%] w-[93%] bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <text
                    className={`${noto_sans_javanese.className} text-xs px-4 text-center font-semibold text-blue-700`}
                  >
                    Live Cashflow & Audit AI
                  </text>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
