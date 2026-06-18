export const NavLinks = () => {
  return (
    <nav className="items-center box-border caret-transparent gap-x-8 hidden min-h-0 min-w-0 gap-y-8 md:flex md:min-h-[auto] md:min-w-[auto]">
      <a
        href="/"
        className="text-gray-900 text-sm font-bold box-border caret-transparent inline leading-5 min-h-0 min-w-0 md:block md:min-h-[auto] md:min-w-[auto]"
      >
        Dashboard
      </a>
      <a
        href="#data-collection"
        className="text-gray-500 text-sm font-bold box-border caret-transparent inline leading-5 min-h-0 min-w-0 md:block md:min-h-[auto] md:min-w-[auto]"
      >
        Data Acquisition
      </a>
      <a
        href="#methodology"
        className="text-gray-500 text-sm font-bold box-border caret-transparent inline leading-5 min-h-0 min-w-0 md:block md:min-h-[auto] md:min-w-[auto]"
      >
        Methodology
      </a>
    </nav>
  );
};
