import { getSession } from "@/lib/session";
import { getProfile, updateProfile, getAllProfiles } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = getProfile(session.username);
  if (!profile) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(profile);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    display_name?: string | null;
    bio?: string;
    avatar_color?: string | null;
  };

  const result = updateProfile(session.username, body);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
