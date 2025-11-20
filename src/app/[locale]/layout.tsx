import "@/styles/globals.css";
import { Tajawal } from "next/font/google";
import { Metadata } from "next";
import { getMessages } from "next-intl/server";
import "server-only";
import { AffonsoWrapper } from "./AffonsoWrapper";
import { AppProviders } from "./AppProviders";

// تحميل خط Tajawal بجميع الأوزان
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/images/logo-black-main.ico",
  },
  title: "Nextbase Ultimate",
  description: "Nextbase Ultimate",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? `https://usenextbase.com`,
  ),
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({
    locale: locale,
  });
  return (
    <html
      lang={locale}
      className={tajawal.className}
      suppressHydrationWarning
    >
      <head>
        <AffonsoWrapper />
      </head>
      <body className="flex flex-col min-h-screen">
        <AppProviders locale={locale} messages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
