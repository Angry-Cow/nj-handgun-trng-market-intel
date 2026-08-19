import { Crosshair } from "lucide-react";

export const HeaderLogo = () => {
  return (
    <a
      href="/"
      className="items-center box-border caret-transparent gap-x-3 flex min-h-[auto] min-w-[auto] gap-y-3"
    >
      <div className="items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.2)_0px_10px_15px_-3px,rgba(11,99,255,0.2)_0px_4px_6px_-4px] box-border caret-transparent flex h-10 justify-center min-h-[auto] min-w-[auto] w-10 rounded-xl">
        <Crosshair className="text-white h-5 w-5" />
      </div>
      <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
        <span className="text-gray-900 text-xl font-black box-border caret-transparent tracking-[-1px] leading-7">
          NJ HANDGUN
        </span>
        <p className="text-blue-600 text-[8px] font-black box-border caret-transparent tracking-[2.4px] leading-3 uppercase -mt-1">
          Market Intelligence
        </p>
      </div>
    </a>
  );
};
