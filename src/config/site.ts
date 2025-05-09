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
  ],
  links: {
    // Add any external links if needed, e.g., twitter: "https://twitter.com/shadcn"
  },
  footerNav: [
    { title: "About Us", href: "#" },
    { title: "Contact", href: "#" },
    { title: "Privacy Policy", href: "#" },
    { title: "Terms of Service", href: "#" },
  ],
};
