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
    <div className="min-h-screen bg-surface text-gray-100">
      {/* Header */}
      <header className="px-6 py-4 bg-surface-raised border-b border-surface-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-accent">Admin Panel</h1>
          <p className="text-xs text-gray-500">Signed in as {session.username}</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            className="px-4 py-2 rounded-lg bg-surface border border-surface-border
                       text-sm text-gray-300 hover:text-accent transition-colors"
          >
            ← Chat
          </a>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-surface border border-surface-border
                         text-sm text-gray-300 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Create user */}
        <section className="bg-surface-raised border border-surface-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-100 mb-4">Create account</h2>
          <AddUserForm action={addUserAction} />
        </section>

        {/* User list */}
        <section className="bg-surface-raised border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-100">Accounts</h2>
            <span className="text-xs text-gray-500">{users.length} total</span>
          </div>

          <ul className="divide-y divide-surface-border">
            {users.map((u) => (
              <li key={u.username} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-200">{u.username}</span>
                    {u.is_admin === 1 && (
                      <span className="text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded font-medium">
                        admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Created {new Date(u.created_at + "Z").toLocaleString()}
                  </p>
                </div>

                {u.is_admin === 0 && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="username" value={u.username} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-md text-xs text-red-400 border border-red-400/20
                                 hover:bg-red-400/10 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </li>
            ))}

            {users.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-gray-600">
                No accounts yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
