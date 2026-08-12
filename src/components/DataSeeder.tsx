import { useEffect, useRef, useState } from "react";
import { useMutation } from "@/lib/useMutation";
import { useQuery } from "@/lib/useQuery";
import { COMPETITOR_SEED_DATA, COUNTY_SEED_DATA, FORECAST_SEED_DATA, REPORT_SEED_DATA, SOURCE_LOG_SEED_DATA } from "../data/seedData";

export const DataSeeder = ({ children }: { children: React.ReactNode }) => {
  const [seeded, setSeeded] = useState(false);
  const seedingRef = useRef(false);

  const { data: competitors, isPending: competitorsPending } = useQuery("Competitor");
  const { data: forecasts, isPending: forecastsPending } = useQuery("MarketForecast");
  const { data: reports, isPending: reportsPending } = useQuery("ResearchReport");
  const { data: sourceLogs, isPending: sourceLogsPending } = useQuery("SourceLog");
  const { data: counties, isPending: countiesPending } = useQuery("County");

  const { create: createCompetitor } = useMutation("Competitor");
  const { create: createForecast } = useMutation("MarketForecast");
  const { create: createReport } = useMutation("ResearchReport");
  const { create: createSourceLog } = useMutation("SourceLog");
  const { create: createCounty } = useMutation("County");

  useEffect(() => {
    if (competitorsPending || forecastsPending || reportsPending || sourceLogsPending || countiesPending) return;
    if (seedingRef.current) return;

    const hasCompetitors = competitors && competitors.length > 0;
    const hasForecasts = forecasts && forecasts.length > 0;
    const hasReports = reports && reports.length > 0;
    const hasSourceLogs = sourceLogs && sourceLogs.length > 0;
    const hasCounties = counties && counties.length > 0;

    if (hasCompetitors && hasForecasts && hasReports && hasSourceLogs && hasCounties) {
      setSeeded(true);
      return;
    }

    seedingRef.current = true;

    const runSeed = async () => {
      try {
        if (!hasCompetitors) {
          for (const c of COMPETITOR_SEED_DATA) {
            await createCompetitor(c);
          }
        }
        if (!hasForecasts) {
          for (const f of FORECAST_SEED_DATA) {
            await createForecast(f);
          }
        }
        if (!hasReports) {
          await createReport(REPORT_SEED_DATA);
        }
        if (!hasSourceLogs) {
          for (const s of SOURCE_LOG_SEED_DATA) {
            await createSourceLog(s);
          }
        }
        if (!hasCounties) {
          for (const c of COUNTY_SEED_DATA) {
            await createCounty(c);
          }
        }
        setSeeded(true);
      } catch (err) {
        console.error("Seed error:", err);
        setSeeded(true);
      }
    };

    runSeed();
  }, [competitorsPending, forecastsPending, reportsPending, sourceLogsPending, countiesPending, competitors, forecasts, reports, sourceLogs, counties]);

  if (!seeded && (competitorsPending || forecastsPending || reportsPending || sourceLogsPending || countiesPending)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-500 font-semibold">Initializing database...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
