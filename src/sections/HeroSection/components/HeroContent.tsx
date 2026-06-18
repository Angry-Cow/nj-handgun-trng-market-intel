export const HeroContent = () => {
  return (
    <div className="relative box-border caret-transparent max-w-none min-h-[auto] min-w-[auto] w-full z-20 mx-auto px-6 md:max-w-screen-xl">
      <div className="box-border caret-transparent max-w-4xl">
        <div className="items-center box-border caret-transparent gap-x-3 flex gap-y-3 mb-6">
          <span className="text-white text-[10px] font-bold bg-blue-600 box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] px-3 py-1 rounded-full">
            Market Research 2026
          </span>
          <span className="text-gray-400 text-xs font-medium box-border caret-transparent block leading-4 min-h-[auto] min-w-[auto]">
            Updated Feb 7, 2026
          </span>
        </div>
        <h1 className="text-white text-6xl font-bold box-border caret-transparent tracking-[-1.5px] leading-[66px] mb-8 md:text-7xl md:tracking-[-1.8px] md:leading-[72px]">
          NJ Handgun Training{" "}
          <br className="text-6xl box-border caret-transparent tracking-[-1.5px] leading-[66px] md:text-7xl md:tracking-[-1.8px] md:leading-[72px]" />
          <span className="text-transparent text-6xl bg-clip-text bg-[linear-gradient(to_right,rgb(11,99,255),rgb(8,73,204))] box-border tracking-[-1.5px] leading-[66px] md:text-7xl md:tracking-[-1.8px] md:leading-[72px]">
            Market Intelligence
          </span>
        </h1>
        <p className="text-gray-300 text-xl box-border caret-transparent leading-[32.5px] max-w-2xl mb-10">
          Demand for firearms safety and handgun training in New Jersey remains
          robust, driven by first-time buyers and evolving concealed-carry
          requirements. Explore our comprehensive analysis of providers across 8
          key counties.
        </p>
        <div className="box-border caret-transparent gap-x-4 flex flex-wrap gap-y-4">
          <button className="text-white font-bold items-center bg-blue-600 shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(11,99,255,0.4)_0px_25px_50px_-12px] caret-transparent flex min-h-[auto] min-w-[auto] text-center px-10 py-5 rounded-2xl">
            Open Dashboard{" "}
            <img
              src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-3.svg"
              alt="Icon"
              className="box-border caret-transparent h-5 w-5 ml-2"
            />
          </button>
          <button className="text-white font-bold items-center backdrop-blur-xl bg-white/10 caret-transparent flex min-h-[auto] min-w-[auto] text-center border px-10 py-5 rounded-2xl border-white/10">
            <img
              src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-4.svg"
              alt="Icon"
              className="text-blue-600 box-border caret-transparent h-5 w-5 mr-2"
            />
            Full Report (MD)
          </button>
        </div>
      </div>
    </div>
  );
};
