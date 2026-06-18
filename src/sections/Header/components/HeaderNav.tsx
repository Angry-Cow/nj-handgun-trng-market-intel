import { HeaderLogo } from "@/sections/Header/components/HeaderLogo";
import { NavLinks } from "@/sections/Header/components/NavLinks";

export const HeaderNav = () => {
  return (
    <div className="items-center box-border caret-transparent flex h-20 justify-between max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
      <HeaderLogo />
      <NavLinks />
    </div>
  );
};
