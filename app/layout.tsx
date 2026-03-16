import { Caveat, Nunito } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${nunito.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased bg-parchment text-ink" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
