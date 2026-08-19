import { useQuery } from "@/lib/useQuery";
import { ChartBar as BarChart3 } from "lucide-react";

const STATEWIDE_YEARS = [2023, 2024, 2025, 2026, 2027, 2028];

export const EnrollmentChart = () => {
  const { data: forecasts, isPending } = useQuery("MarketForecast", {
    where: { county: "Statewide" },
    orderBy: { year: "asc" },
  });

  const maxEnrollment = forecasts && forecasts.length > 0
    ? Math.max(...forecasts.map((f) => f.projectedEnrollments))
    : 20600;

  const getBar = (year: number) => {
    const f = forecasts?.find((x) => x.year === year);
    if (!f) return { pct: 0, enrollments: 0.1, revenue: 0 };
    return {
      pct: Math.round((f.projectedEnrollments / maxEnrollment) * 100),
      enrollments: f.projectedEnrollments,
      revenue: f.estimatedRevenue,
    };
  };

  const currentYear = new Date().getFullYear();
  const totalGrowth = (() => {
    if (!forecasts || forecasts.length < 2) return 24;
    const first = forecasts[0]?.projectedEnrollments;
    const last = forecasts[forecasts.length - 1]?.projectedEnrollments;
    return Math.round(((last - first) / first) * 100);
  })();

  return (
    <div className="bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent min-h-[auto] min-w-[auto] border border-gray-200 p-10 rounded-[40px] border-solid">
      <div className="items-center box-border caret-transparent flex justify-between mb-8">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <h3 className="text-2xl font-bold items-center box-border caret-transparent gap-x-2 flex leading-8 gap-y-2">
            <BarChart3 className="text-blue-600 h-6 w-6" />
            Enrollment Forecast
          </h3>
          <p className="text-gray-500 text-sm font-medium box-border caret-transparent leading-5">
            Projected growth 2023–2028 (CAGR 4–7%)
          </p>
        </div>
        <span className="text-green-600 text-[10px] font-black bg-green-600/10 box-border caret-transparent block tracking-[1px] leading-[15px] min-h-[auto] min-w-[auto] uppercase px-3 py-1 rounded-full">
          +{totalGrowth}% Total
        </span>
      </div>
      {isPending ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div></div>
      ) : (
        <div className="box-border caret-transparent space-y-6">
          {STATEWIDE_YEARS.map((year) => {
            const { pct, enrollments, revenue } = getBar(year);
            const isCurrent = year === currentYear;
            return (
              <div key={year} title={`${year}: ~${enrollments.toLocaleString()} enrollments | ~$${(revenue / 1000000).toFixed(2)}M revenue`}>
                <div className="text-xs font-bold box-border caret-transparent flex justify-between leading-4 mb-2">
                  <span className={isCurrent ? "text-blue-600" : "text-gray-500"}>
                    {year}{isCurrent ? " — Current Year" : year > currentYear ? " — Projected" : year === 2023 ? " — Baseline" : ""}
                  </span>
                  <span className="box-border caret-transparent">{enrollments.toLocaleString()} enrollments</span>
                </div>
                <div className="bg-gray-100 box-border caret-transparent h-3 overflow-hidden rounded-full">
                  <div
                    className={`${isCurrent ? "bg-blue-600 shadow-[rgba(11,99,255,0.4)_0px_0px_15px_0px]" : "bg-gray-300"} box-border caret-transparent h-full transition-all rounded-full`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
