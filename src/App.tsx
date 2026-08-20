import { AuthProvider, useAuth } from "@/lib/auth";
import { Header } from "@/sections/Header";
import { Main } from "@/components/Main";
import { DataSeeder } from "@/components/DataSeeder";
import { LoginScreen } from "@/sections/LoginScreen";

const AppContent = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

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

export const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
