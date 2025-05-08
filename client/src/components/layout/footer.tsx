import { Link } from "wouter";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin 
} from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  
  const footerLinks = [
    { href: "/about", label: "About" },
    { href: "/", label: "How It Works" },
    { href: "/", label: "Safety" },
    { href: "/", label: "FAQs" },
    { href: "/", label: "Terms & Conditions" },
    { href: "/", label: "Privacy Policy" },
    { href: "/", label: "Contact Us" },
  ];
  
  const socialLinks = [
    { 
      href: "#", 
      label: "Facebook", 
      icon: <Facebook className="h-5 w-5" /> 
    },
    { 
      href: "#", 
      label: "Instagram", 
      icon: <Instagram className="h-5 w-5" /> 
    },
    { 
      href: "#", 
      label: "Twitter", 
      icon: <Twitter className="h-5 w-5" /> 
    },
    { 
      href: "#", 
      label: "LinkedIn", 
      icon: <Linkedin className="h-5 w-5" /> 
    },
  ];
  
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          {footerLinks.map((link) => (
            <div key={link.label} className="px-5 py-2">
              <Link href={link.href}>
                <a className="text-base text-gray-500 hover:text-gray-900">
                  {link.label}
                </a>
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          {socialLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="text-gray-400 hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">{link.label}</span>
              {link.icon}
            </a>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {year} LuggageLink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
