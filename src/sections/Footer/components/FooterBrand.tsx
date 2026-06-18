export const FooterBrand = () => {
  return (
    <div className="items-start box-border caret-transparent gap-x-12 flex flex-col justify-between gap-y-12 mb-16 md:items-center md:flex-row">
      <div className="items-center box-border caret-transparent gap-x-4 flex min-h-[auto] min-w-[auto] gap-y-4">
        <div className="items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.2)_0px_20px_25px_-5px,rgba(11,99,255,0.2)_0px_8px_10px_-6px] box-border caret-transparent flex h-12 justify-center min-h-[auto] min-w-[auto] w-12 rounded-2xl">
          <img
            src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-27.svg"
            alt="Icon"
            className="text-white box-border caret-transparent h-6 w-6"
          />
        </div>
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <span className="text-2xl font-black box-border caret-transparent tracking-[-1.2px] leading-8">
            NJ HANDGUN TRAINING
          </span>
          <p className="text-gray-500 text-xs font-bold box-border caret-transparent tracking-[1.2px] leading-4 uppercase mt-1">
            Market Intelligence Dashboard
          </p>
        </div>
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
