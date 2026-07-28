import { HeroSection } from "@/components/blocks/hero-section";
import CallToAction from "@/components/call-to-action";
import FooterSection from "@/components/footer";
import { Header } from "@/components/header";
import HowitWorks from "@/components/how-it-work-section";
import IntegrationsSection from "@/components/integrations";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />

      {/* how it works */}
      <HowitWorks />

      {/* integration */}
      <IntegrationsSection />

      {/* CTA */}
      <CallToAction />

      {/* footer */}
      <FooterSection />
    </div>
  );
}
