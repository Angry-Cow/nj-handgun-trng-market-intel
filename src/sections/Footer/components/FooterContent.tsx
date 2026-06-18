import { FooterBrand } from "@/sections/Footer/components/FooterBrand";
import { FooterCopyright } from "@/sections/Footer/components/FooterCopyright";

export const FooterContent = () => {
  return (
    <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
      <FooterBrand />
      <FooterCopyright />
    </div>
  );
};
