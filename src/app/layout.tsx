import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { getAllUsers, getCurrentUser } from "@/lib/auth";
import { ensureDatabaseReady } from "@/lib/db-init";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabDocs by Ma. Antonette Cabang",
  description: "Lightweight collaborative document editor",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let users: Awaited<ReturnType<typeof getAllUsers>> = [];
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>> | null = null;
  let bootError: string | null = null;

  try {
    await ensureDatabaseReady(prisma);
    users = await getAllUsers();
    currentUser = await getCurrentUser();
  } catch (error) {
    bootError =
      error instanceof Error
        ? error.message
        : "Database is not ready. Run prisma migrate and seed.";
  }

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Providers>
          {currentUser ? (
            <Header users={users} currentUser={currentUser} />
          ) : (
            <header className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {bootError}
            </header>
          )}
          <main className="flex flex-1 flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
