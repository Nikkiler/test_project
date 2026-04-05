"use client";

import { useActionState } from "react";
import { useState } from "react";

type ActionFn = (
  prev: { error?: string } | null,
  formData: FormData
) => Promise<{ error?: string }>;

export default function AddUserForm({ action }: { action: ActionFn }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [success, setSuccess] = useState(false);

  return (
    <form
      action={async (fd) => {
        setSuccess(false);
        await formAction(fd);
        if (!state?.error) setSuccess(true);
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Username
          </label>
          <input
            name="username"
            type="text"
            required
            autoComplete="off"
            className="px-3 py-2 rounded-lg bg-surface border-2 border-surface-border
                       text-gray-100 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="px-3 py-2 rounded-lg bg-surface border-2 border-surface-border
                       text-gray-100 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      {success && !state?.error && (
        <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
          Account created.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-surface
                   font-semibold text-sm transition-colors disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
