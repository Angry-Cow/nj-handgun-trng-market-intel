import { useQuery } from "@animaapp/playground-react-sdk";

export const PricingChart = () => {
  const { data: competitors, isPending } = useQuery("Competitor");

  const prices = (competitors ?? []).filter((c) => c.ccwPrepPrice != null).map((c) => c.ccwPrepPrice!);
  const total = prices.length;
  const budget = prices.filter((p) => p < 100).length;
  const standard = prices.filter((p) => p >= 100 && p < 200).length;
  const premium = prices.filter((p) => p >= 200).length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  const avg = total > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / total) : 184;

  return (
    <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent min-h-[auto] min-w-[auto] border border-gray-200 p-10 rounded-[40px] border-solid">
      <div className="items-center box-border caret-transparent flex justify-between mb-8">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <h3 className="text-2xl font-bold items-center box-border caret-transparent gap-x-2 flex leading-8 gap-y-2">
            <img src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-12.svg" alt="Icon" className="text-amber-500 box-border caret-transparent h-6 w-6" />
            Pricing Distribution
          </h3>
          <p className="text-gray-500 text-sm font-medium box-border caret-transparent leading-5">
            CCW Qualification Course Benchmarks
          </p>
        </div>
        <span className="text-amber-500 text-[10px] font-black bg-amber-500/10 box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] uppercase px-3 py-1 rounded-full">
          {isPending ? "..." : `${total} records`}
        </span>
      </div>
      <div className="box-border caret-transparent gap-x-6 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-6 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          {[
            { label: "Budget (<$100)", pct: pct(budget), color: "bg-green-600", count: budget },
            { label: "Standard ($100-$199)", pct: pct(standard), color: "bg-blue-600", count: standard },
            { label: "Premium ($200+)", pct: pct(premium), color: "bg-amber-500", count: premium },
          ].map(({ label, pct: p, color, count }) => (
            <div key={label} className="bg-slate-50 box-border caret-transparent border border-gray-100 p-4 rounded-2xl border-solid mt-4 first:mt-0">
              <div className="items-center box-border caret-transparent flex justify-between mb-2">
                <span className="text-gray-500 text-[10px] font-black box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] uppercase">{label}</span>
                <span className="text-sm font-bold box-border caret-transparent block leading-5 min-h-[auto] min-w-[auto]">{isPending ? "..." : `${p}%`} {!isPending && <span className="text-xs text-gray-400">({count})</span>}</span>
              </div>
              <div className="bg-gray-200 box-border caret-transparent h-1.5 overflow-hidden rounded-full">
                <div className={`${color} box-border caret-transparent h-full rounded-full transition-all`} style={{ width: `${p}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="items-center bg-blue-600/10 box-border caret-transparent flex flex-col justify-center min-h-[auto] min-w-[auto] text-center border border-blue-600/10 p-8 rounded-[32px] border-solid">
          <img src="https://c.animaapp.com/mn5696zt0wUcrM/assets/icon-13.svg" alt="Icon" className="text-blue-600 box-border caret-transparent h-12 w-12 mb-4" />
          <h4 className="text-blue-600 text-4xl font-black box-border caret-transparent leading-10 min-h-[auto] min-w-[auto] mb-2">
            {isPending ? "..." : `$${avg}`}
          </h4>
          <p className="text-gray-500 text-xs font-bold box-border caret-transparent tracking-[1.2px] leading-4 min-h-[auto] min-w-[auto] uppercase">
            Market Average
          </p>
          <div className="box-border caret-transparent min-h-[auto] min-w-[auto] w-full border-blue-600/10 mt-6 pt-6 border-t border-solid">
            <p className="text-gray-500 text-[10px] italic box-border caret-transparent leading-[16.25px]">
              &quot;NJ&#39;s permit regime sustains demand for certified CCW preparation.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
