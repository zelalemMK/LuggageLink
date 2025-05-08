import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorks } from "@/components/sections/how-it-works";
import { SafetyInfo } from "@/components/sections/safety-info";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>LuggageLink - Connect Travelers with Senders to Ethiopia</title>
        <meta name="description" content="LuggageLink connects people who want to send luggage to Ethiopia with travelers who have extra space. Safe, secure, and cost-effective." />
        <meta property="og:title" content="LuggageLink - Connect Travelers with Senders" />
        <meta property="og:description" content="Send luggage to Ethiopia safely and affordably with LuggageLink." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <HowItWorks />
          <SafetyInfo />
        </main>
        <Footer />
      </div>
    </>
  );
}
