import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import { siteConfig } from '@/config/site';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'; // Added social icons

export default function Footer() {
  return (
    <footer className="w-full border-t bg-secondary/30">
      <div className="container grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            {siteConfig.description}
          </p>
           <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Contact Info:</p>
            <a href="mailto:support@learnifyapp.com" className="text-sm text-muted-foreground hover:text-primary block">
              support@learnifyapp.com
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-2 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2">
              {siteConfig.mainNav.map((item) => ( // Changed to mainNav for consistency if pricing is removed from mainNav
                <li key={item.title}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2">
              {siteConfig.footerNav.filter(item => item.title === "Privacy Policy" || item.title === "Terms of Service").map((item) => (
                <li key={item.title}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Stay Connected</h3>
            <p className="mt-4 text-sm text-muted-foreground">Subscribe to our newsletter for updates.</p>
            <form className="mt-2 flex space-x-2">
              <Input type="email" placeholder="Enter your email" className="max-w-lg flex-1" />
              <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
             <div className="mt-4 flex space-x-3">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
