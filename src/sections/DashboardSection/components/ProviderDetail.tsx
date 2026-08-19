import { MapPin } from "lucide-react";

export const ProviderDetail = () => {
  return (
    <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent flex flex-col min-h-[700px] min-w-[auto] border border-gray-200 overflow-hidden rounded-[40px] border-solid">
      <div className="items-center box-border caret-transparent flex basis-[0%] grow justify-center min-h-[auto] min-w-[auto] text-center p-16">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <div className="items-center bg-gray-50 box-border caret-transparent flex h-24 justify-center w-24 mb-8 mx-auto rounded-full">
            <MapPin className="text-gray-200 h-12 w-12" />
          </div>
          <h4 className="text-2xl font-bold box-border caret-transparent leading-8 mb-4">
            Select a Provider
          </h4>
          <p className="text-gray-500 box-border caret-transparent leading-[26px]">
            Click any pin on the map to unlock deep-dive pricing benchmarks,
            facility details, and contact intelligence.
          </p>
        </div>
      </div>
    </div>
  );
};
