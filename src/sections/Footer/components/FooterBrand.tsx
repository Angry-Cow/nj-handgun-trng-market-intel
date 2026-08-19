export const FooterBrand = () => {
  return (
    <div className="items-start box-border caret-transparent gap-x-12 flex flex-col justify-between gap-y-12 mb-16 md:items-center md:flex-row">
      <div className="items-center box-border caret-transparent gap-x-4 flex min-h-[auto] min-w-[auto] gap-y-4">
        <img
          src="https://sdejmmvtjzimhejwkvae.supabase.co/storage/v1/object/public/site-assets/nj-handgun-market-intelligence.png"
          alt="NJ Handgun Market Intelligence"
          className="h-12 w-auto object-contain"
        />
      </div>
      <div className="text-gray-500 text-sm font-bold box-border caret-transparent gap-x-10 flex flex-wrap leading-5 min-h-[auto] min-w-[auto] gap-y-10">
        <a
          href="#"
          className="box-border caret-transparent block min-h-[auto] min-w-[auto]"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="box-border caret-transparent block min-h-[auto] min-w-[auto]"
        >
          Terms of Service
        </a>
        <a
          href="#"
          className="box-border caret-transparent block min-h-[auto] min-w-[auto]"
        >
          Contact Support
        </a>
        <a
          href="#"
          className="box-border caret-transparent block min-h-[auto] min-w-[auto]"
        >
          API Documentation
        </a>
      </div>
    </div>
  );
};
