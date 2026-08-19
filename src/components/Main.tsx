import { ExternalLink } from "lucide-react";
import { HeroSection } from "@/sections/HeroSection";
import { DashboardSection } from "@/sections/DashboardSection";

export const Main = () => {
  return (
    <main className="box-border caret-transparent basis-[0%] grow min-h-[auto] min-w-[auto]">
      <div className="text-gray-900 bg-slate-50 box-border caret-transparent min-h-[1000px]">
        <HeroSection />
        <DashboardSection />
        <footer className="bg-white box-border caret-transparent border-gray-200 py-20 border-t border-solid">
          <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
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
            <div className="items-center box-border caret-transparent gap-x-6 flex flex-col justify-between gap-y-6 border-gray-100 pt-10 border-t border-solid md:flex-row">
              <p className="text-gray-500 text-sm font-medium box-border caret-transparent leading-5 min-h-[auto] min-w-[auto]">
                © 2026 Market Research Dashboard. Built for NJ Firearms
                Instructors.
              </p>
              <div className="text-sm font-bold items-center box-border caret-transparent gap-x-2 flex leading-5 min-h-[auto] min-w-[auto] gap-y-2">
                <span className="text-gray-500 box-border caret-transparent block min-h-[auto] min-w-[auto]">
                  Powered by
                </span>
                <a
                  href="https://heyboss.ai/"
                  className="text-blue-600 items-center box-border caret-transparent flex min-h-[auto] min-w-[auto]"
                >
                  Heyboss.ai{" "}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};
