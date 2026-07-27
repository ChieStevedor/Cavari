import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSteps } from "@/components/sections/SolutionSteps";
import { Features } from "@/components/sections/Features";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { WhyLaviius } from "@/components/sections/WhyLaviius";
import { Testimonials } from "@/components/sections/Testimonials";
import { Coverage } from "@/components/sections/Coverage";
import { FinalCta } from "@/components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSteps />
        <Features />
        <DashboardPreview />
        <WhyLaviius />
        <Testimonials />
        <Coverage />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
