import { useAuth } from "@/lib/auth";

export const NavActions = () => {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="text-gray-700 hover:text-gray-900 text-sm font-bold transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
    >
      Log out
    </button>
  );
};
