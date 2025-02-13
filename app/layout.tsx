import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'City Explorer - AI-Powered Travel Planning',
  description: 'Plan your perfect city exploration with AI-powered recommendations and optimized routes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="relative min-h-screen">
            <Navbar />
            <main className="pt-16 pb-32">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}