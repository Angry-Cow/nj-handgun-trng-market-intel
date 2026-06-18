import { HeroBackground } from "@/sections/HeroSection/components/HeroBackground";
import { HeroOverlay } from "@/sections/HeroSection/components/HeroOverlay";
import { HeroContent } from "@/sections/HeroSection/components/HeroContent";

export const HeroSection = () => {
  return (
    <section className="relative items-center bg-blue-900 box-border caret-transparent flex h-auto overflow-hidden py-20">
      <HeroContent />
    </section>
  );
};
