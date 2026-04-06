import { getAllUsers } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { addUserAction, deleteUserAction } from "./actions";
import AddUserForm from "./AddUserForm";

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/");

  const users = getAllUsers();

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between panel-specular"
        style={{
          background: `rgba(var(--bg-overlay-rgb), 0.95)`,
          borderBottom: `1px solid rgba(var(--border-rgb), 0.2)`,
        }}
      >
        <div>
          <h1
            className="font-bold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              color: "var(--accent)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Command Panel
          </h1>
          <p
            className="mt-0.5"
            style={{ fontSize: "11px", color: `rgba(var(--text-rgb), 0.35)` }}
          >
            Signed in as {session.username}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            className="btn-gradient px-4 py-2 flex items-center gap-1.5 text-xs"
          >
            ← Chat
          </a>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 text-xs transition-colors duration-150 hover:text-red-400"
              style={{
                border: `1px solid rgba(var(--border-rgb), 0.25)`,
                color: `rgba(var(--text-rgb), 0.4)`,
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Create user */}
        <section
          style={{
            background: `rgba(var(--bg-overlay-rgb), 0.90)`,
            border: `1px solid rgba(var(--border-rgb), 0.2)`,
            clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
          }}
        >
          {/* Section header */}
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: `1px solid rgba(var(--border-rgb), 0.15)` }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                color: `rgba(var(--accent-rgb), 0.65)`,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Create Account
            </h2>
          </div>
          <div className="p-5">
            <AddUserForm action={addUserAction} />
          </div>
        </section>

        {/* User list */}
        <section
          style={{
            background: `rgba(var(--bg-overlay-rgb), 0.90)`,
            border: `1px solid rgba(var(--border-rgb), 0.2)`,
            clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
            overflow: "hidden",
          }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: `1px solid rgba(var(--border-rgb), 0.15)` }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                color: `rgba(var(--accent-rgb), 0.65)`,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Accounts
            </h2>
            <span
              style={{
                fontSize: "11px",
                color: `rgba(var(--text-rgb), 0.25)`,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.08em",
              }}
            >
              {users.length} total
            </span>
          </div>

          <ul>
            {users.map((u) => (
              <li
                key={u.username}
                className="flex items-center gap-3 px-5 py-3 transition-colors duration-150"
                style={{
                  borderBottom: `1px solid rgba(var(--border-rgb), 0.08)`,
                }}
                onMouseEnter={undefined}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `rgba(var(--accent-rgb), 0.08)`,
                    border: `1px solid rgba(var(--accent-rgb), 0.25)`,
                    color: "var(--accent)",
                    clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }}
                >
                  {u.username[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {u.username}
                    </span>
                    {u.is_admin === 1 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5"
                        style={{
                          fontFamily: "var(--font-display)",
                          background: `rgba(var(--accent-rgb), 0.12)`,
                          color: "var(--accent)",
                          border: `1px solid rgba(var(--accent-rgb), 0.3)`,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: `rgba(var(--text-rgb), 0.25)` }}
                  >
                    Created {new Date(u.created_at + "Z").toLocaleString()}
                  </p>
                </div>

                {u.is_admin === 0 && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="username" value={u.username} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs transition-all duration-150 hover:bg-red-500/10"
                      style={{
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                        clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                      }}
                    >
                      Delete
                    </button>
                  </form>
                )}
              </li>
            ))}

            {users.length === 0 && (
              <li
                className="px-5 py-6 text-center text-sm"
                style={{ color: `rgba(var(--text-rgb), 0.25)` }}
              >
                No accounts yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
