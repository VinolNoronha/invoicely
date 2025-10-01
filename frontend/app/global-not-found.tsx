// app/global-not-found.tsx
import "./globals.css";
import { Inter, Noto_Sans_Javanese } from "next/font/google";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

const noto_sans_javanese = Noto_Sans_Javanese({
  weight: "400",
  subsets: ["latin"],
});

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex items-center justify-center h-screen bg-gray-50">
        <div
          className={`${noto_sans_javanese.className} text-1xl leading-[1.2] text-center p-4 `}
        >
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Oops! Page not found
          </h2>
          <p className="text-gray-500 mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="flex items-center justify-center bg-black text-white px-5 py-3 rounded-md hover:bg-gray-800 transition-transform duration-200 font-medium"
          >
            Go Back Home
          </Link>
        </div>
      </body>
    </html>
  );
}
