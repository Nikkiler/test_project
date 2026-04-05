import { getSession } from "@/lib/session";
import { getAllProfiles } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = getAllProfiles();
  // Return as a map keyed by username for easy lookup
  const map: Record<string, { display_name: string | null; bio: string; avatar_color: string | null }> = {};
  for (const p of profiles) {
    map[p.username] = { display_name: p.display_name, bio: p.bio, avatar_color: p.avatar_color };
  }
  return Response.json(map);
}
