import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentUser } from "../hooks/useCurrentUser";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/devices", label: "Devices", icon: "📷" },
  { to: "/history", label: "History", icon: "🕘" },
  { to: "/subscription", label: "Subscription", icon: "⭐" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export function Layout() {
  const { disconnect } = useAuth();
  const { data: user } = useCurrentUser();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold text-white">
          <span className="text-accent">●</span> RingBoard
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-accent text-white" : "text-gray-400 hover:bg-surface-raised hover:text-white"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-6">
          <div className="text-sm font-semibold text-white md:hidden">RingBoard</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {(user?.name ?? "?").charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm text-gray-300 sm:inline">{user?.name ?? "Loading…"}</span>
            </div>
            <button
              onClick={disconnect}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-surface-raised"
            >
              Disconnect
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? "text-accent" : "text-gray-400"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
