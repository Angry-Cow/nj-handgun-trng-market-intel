import { ExternalLink } from "lucide-react";

export const FooterCopyright = () => {
  return (
    <div className="items-center box-border caret-transparent gap-x-6 flex flex-col justify-between gap-y-6 border-gray-100 pt-10 border-t border-solid md:flex-row">
      <p className="text-gray-500 text-sm font-medium box-border caret-transparent leading-5 min-h-[auto] min-w-[auto]">
        © 2026 Market Research Dashboard. Built for NJ Firearms Instructors.
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
  );
};
