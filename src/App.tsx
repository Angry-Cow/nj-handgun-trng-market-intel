import { Header } from "@/sections/Header";
import { Main } from "@/components/Main";
import { DataSeeder } from "@/components/DataSeeder";

export const App = () => {
  return (
    <body className="text-black text-base not-italic normal-nums font-normal accent-auto box-border caret-transparent block tracking-[normal] leading-6 list-outside list-disc pointer-events-auto text-start indent-[0px] normal-case visible border-separate font-inter">
      <DataSeeder>
        <div className="box-border caret-transparent">
          <div className="box-border caret-transparent flex flex-col min-h-[1000px]">
            <Header />
            <Main />
          </div>
        </div>
      </DataSeeder>
    </body>
  );
};
