import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Escalas ministeriais",
    template: "%s · Escalas",
  },
  description: "Geração e montagem de escalas para conjunto musical",
  applicationName: "Escalas",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Escalas",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3efe4",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const dispositivo =
    headerList.get("x-device-type") ??
    cookieStore.get("device_ua")?.value ??
    "desktop";

  return (
    <html
      lang="pt-BR"
      data-device={dispositivo}
      className={`${figtree.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-cream">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
