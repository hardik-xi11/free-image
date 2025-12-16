import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google'; // Using Outfit for a more geometric/futuristic look similar to Arc Raiders
import './globals.css';
import { cn } from '@/lib/utils';

const font = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Free-Image-Converter',
  description: 'Convert jpg to png or webp to png for free.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <meta name="google-adsense-account" content="ca-pub-8937532527520656"></meta>
      <body className={cn(font.className, "min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-yellow-500 selection:text-black")}>
        {/* Retro Rainbow Branding Band - Fixed Left */}
        <div className="fixed top-0 left-0 bottom-0 w-2 flex z-50 pointer-events-none">
          <div className="h-full w-1/4 bg-[#ff2a2a]"></div>
          <div className="h-full w-1/4 bg-[#ffcc00]"></div>
          <div className="h-full w-1/4 bg-[#33cc33]"></div>
          <div className="h-full w-1/4 bg-[#00ccff]"></div>
        </div>

        {/* Grain Overlay */}
        <div className="bg-grain"></div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
