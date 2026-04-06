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
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "10px",
              fontWeight: 700,
              color: `rgba(var(--accent-rgb), 0.55)`,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Username
          </label>
          <input
            name="username"
            type="text"
            required
            autoComplete="off"
            className="input-neon px-3 py-2 text-sm"
            style={{
              background: `rgba(var(--accent-rgb), 0.025)`,
              border: `1px solid rgba(var(--border-rgb), 0.25)`,
              color: "var(--text)",
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "10px",
              fontWeight: 700,
              color: `rgba(var(--accent-rgb), 0.55)`,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input-neon px-3 py-2 text-sm"
            style={{
              background: `rgba(var(--accent-rgb), 0.025)`,
              border: `1px solid rgba(var(--border-rgb), 0.25)`,
              color: "var(--text)",
            }}
          />
        </div>
      </div>

      {state?.error && (
        <p
          className="text-sm px-3 py-2"
          style={{
            color: "#ef4444",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {state.error}
        </p>
      )}

      {success && !state?.error && (
        <p
          className="text-sm px-3 py-2"
          style={{
            color: "var(--online-color)",
            background: `rgba(var(--accent-rgb), 0.06)`,
            border: `1px solid rgba(var(--accent-rgb), 0.2)`,
          }}
        >
          Account created.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-gradient btn-filled self-start px-5 py-2 text-xs disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
