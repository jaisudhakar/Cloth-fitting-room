import { EditorialSlider } from "@/components/home/EditorialSlider";
import { Hero, ServiceStrip } from "@/components/home/Hero";
import { BestSellers, CategoriesGrid, EditorialSplit, LuxBanner, NewDrops, OfferBanner, Reviews } from "@/components/home/Sections";
import { Spotlight } from "@/components/home/Spotlight";
import { StylePillars } from "@/components/home/StylePillars";

export default function Home() {
  return (
    <>
      <Hero />
      <ServiceStrip />
      <StylePillars />
      <EditorialSplit />
      <CategoriesGrid />
      <NewDrops />
      <OfferBanner />
      <BestSellers />
      <EditorialSlider />
      <Spotlight />
      <Reviews />
      <LuxBanner />
    </>
  );
}
