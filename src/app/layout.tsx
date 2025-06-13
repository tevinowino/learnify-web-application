
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthProvider';
import Navbar from '@/components/shared/Navbar';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com'; // Fallback if not set

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
        url: `${APP_URL}/og-image.png`, // Replace with your actual OG image path
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
    // site: '@yourtwitterhandle', // Optional: Your Twitter handle
    // creator: '@creatorhandle', // Optional: Creator's Twitter handle
    images: [`${APP_URL}/twitter-image.png`], // Replace with your actual Twitter image path
  },
  icons: [
    {
      rel: 'icon',
      url: '/logo-icon.png', // Ensure this path is correct
    },
    {
      rel: 'apple-touch-icon',
      url: '/logo-icon.png', // Ensure this path is correct
    },
  ],
  manifest: `${APP_URL}/site.webmanifest`, // Optional: if you have a webmanifest
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
    "logo": `${APP_URL}/logo-icon.png`, // Ensure this path is correct
    "sameAs": [ // Optional: Add social media links if you have them
      // "https://www.facebook.com/yourlearnify",
      // "https://www.twitter.com/yourlearnify",
      // "https://www.linkedin.com/company/yourlearnify"
    ]
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
        "urlTemplate": `${APP_URL}/search?q={search_term_string}` // If you have a search page
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
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow container mx-auto">{children}</main>
              </div>
              <Toaster />
            </AuthProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
