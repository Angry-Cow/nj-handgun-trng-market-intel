import { EnrollmentChart } from "@/sections/DashboardSection/components/ChartsSection/EnrollmentChart";
import { PricingChart } from "@/sections/DashboardSection/components/ChartsSection/PricingChart";

export const ChartsSection = () => {
  return (
    <section className="box-border caret-transparent gap-x-10 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-10 mb-24 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
      <EnrollmentChart />
      <PricingChart />
    </section>
  );
};
