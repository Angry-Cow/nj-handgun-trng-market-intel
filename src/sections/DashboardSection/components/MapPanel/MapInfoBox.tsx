export const MapInfoBox = () => {
  return (
    <div className="absolute backdrop-blur-md bg-white/90 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_2px_0px] box-border caret-transparent pointer-events-none z-10 border border-gray-100 p-4 rounded-2xl border-solid left-8 bottom-8">
      <div className="box-border caret-transparent text-left">
        <h4 className="text-sm font-bold box-border caret-transparent tracking-[0.7px] leading-5 uppercase mb-1">
          Interactive Map
        </h4>
        <p className="text-gray-500 text-xs box-border caret-transparent leading-[19.5px]">
          66 providers across NJ
        </p>
      </div>
    </div>
  );
};
