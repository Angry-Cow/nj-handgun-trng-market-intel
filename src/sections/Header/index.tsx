import { HeaderNav } from "@/sections/Header/components/HeaderNav";

export const Header = () => {
  return (
    <header className="sticky backdrop-blur-xl bg-white/80 box-border caret-transparent min-h-[auto] min-w-[auto] z-[100] border-gray-100 border-b border-solid top-0">
      <HeaderNav />
    </header>
  );
};
