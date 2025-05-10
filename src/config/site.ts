export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Learnify",
  description:
    "Personalized learning paths to help students achieve their full potential.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "About",
      href: "/#about", 
    },
    // { // Removed Pricing link
    //   title: "Pricing",
    //   href: "/#pricing",
    // },
    {
      title: "Contact Us",
      href: "/#contact",
    }
  ],
  links: {
    // Add any external links if needed, e.g., twitter: "https://twitter.com/shadcn"
  },
  footerNav: [
    { title: "About Us", href: "/#about" },
    { title: "Contact", href: "/#contact" },
    { title: "Privacy Policy", href: "/privacy" }, 
    { title: "Terms of Service", href: "/terms" }, 
  ],
};
