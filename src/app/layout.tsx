
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthProvider';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/theme-provider';
import LayoutClientManager from '@/components/shared/LayoutClientManager'; // Import the new client component

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${siteConfig.name} - AI-Powered Education Platform`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Learnify",
    "AI education",
    "personalized learning",
    "school management",
    "edtech",
    "AI tutor",
    "teacher assistant",
    "online learning platform",
    "K-12 education",
    "student information system",
    "classroom management",
  ],
  authors: [{ name: "Learnify Team", url: APP_URL }],
  creator: "Learnify Team",
  publisher: "Learnify",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    title: `${siteConfig.name} - AI-Powered Education Platform`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Revolutionizing Education with AI`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - AI-Powered Education Platform`,
    description: siteConfig.description,
    images: [`${APP_URL}/twitter-image.png`],
  },
  icons: [
    {
      rel: 'icon',
      url: '/logo-icon.png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/logo-icon.png',
    },
  ],
  manifest: `${APP_URL}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteConfig.name,
    "url": APP_URL,
    "logo": `${APP_URL}/logo-icon.png`,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteConfig.name,
    "url": APP_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${APP_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <AuthProvider>
              <LayoutClientManager>
                {children}
              </LayoutClientManager>
              <Toaster />
            </AuthProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
