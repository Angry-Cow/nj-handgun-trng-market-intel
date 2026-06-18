export const MapLegend = () => {
  return (
    <div className="absolute text-xs font-bold backdrop-blur-xl bg-white/100 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.1)_0px_10px_15px_-3px,rgba(0,0,0,0.1)_0px_4px_6px_-4px] box-border caret-transparent gap-x-3 flex flex-col leading-4 gap-y-3 z-[1000] border border-gray-200 p-4 rounded-2xl border-solid right-8 top-8">
      <div className="items-center box-border caret-transparent flex min-h-[auto] min-w-[auto]">
        <span className="bg-blue-600 box-border caret-transparent block h-3 min-h-[auto] min-w-[auto] w-3 mr-2 rounded-full"></span>
        Provider
      </div>
      <div className="items-center box-border caret-transparent flex min-h-[auto] min-w-[auto]">
        <span className="bg-amber-500 box-border caret-transparent block h-3 min-h-[auto] min-w-[auto] w-3 mr-2 rounded-full"></span>
        Selected
      </div>
    </div>
  );
};
