
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Learnify",
  description:
    "Revolutionize your school’s operations with AI-powered tools designed to save time, improve outcomes, and prepare students for tomorrow’s world.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "About",
      href: "/about", 
    },
    // Pricing removed from main nav based on user instructions to remove pricing section from landing
    {
      title: "Contact Us",
      href: "/contact", // Points to the dedicated contact page, not section on homepage
    }
  ],
  links: {
    // Add any external links if needed, e.g., twitter: "https://twitter.com/shadcn"
  },
  footerNav: [ // These are generally page links for the footer
    { title: "About Us", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Privacy Policy", href: "/privacy" }, 
    { title: "Terms of Service", href: "/terms" }, 
  ],
};
