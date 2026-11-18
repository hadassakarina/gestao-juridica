
import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Navegacao } from "./navegacao";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gestão Jurídica",
  description: "Plataforma de gestão para escritórios de advocacia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="antialiased"><Navegacao>{children}</Navegacao></body>
    </html>
  );
}
