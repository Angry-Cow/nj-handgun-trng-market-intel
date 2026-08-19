import { TrendingUp, type LucideIcon } from "lucide-react";

export type StatCardProps = {
  title: string;
  value: string;
  footerText: string;
  icon: LucideIcon;
  accentColorClass: string;
};

export const StatCard = (props: StatCardProps) => {
  return (
    <div className="items-start bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.05)_0px_1px_2px_0px] box-border caret-transparent flex justify-between min-h-[auto] min-w-[auto] border border-gray-100 p-6 rounded-2xl border-solid">
      <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
        <p className="text-gray-500 text-xs font-bold box-border caret-transparent tracking-[1.2px] leading-4 uppercase mb-2">
          {props.title}
        </p>
        <h3 className="text-3xl font-bold box-border caret-transparent leading-9">
          {props.value}
        </h3>
        <div className="text-green-600 text-xs font-bold items-center box-border caret-transparent flex leading-4 mt-2">
          <TrendingUp className="h-3 w-3 mr-1" />
          {props.footerText}
        </div>
      </div>
      <div
        className={`${props.accentColorClass} box-border caret-transparent min-h-[auto] min-w-[auto] p-4 rounded-xl`}
      >
        <props.icon className="h-6 w-6" />
      </div>
    </div>
  );
};
