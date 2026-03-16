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

export const metadata = {
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
};

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
