import { getAllUsers } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = getAllUsers();
  // Return usernames only; exclude the requesting user
  const users = all
    .filter((u) => u.username !== session.username)
    .map((u) => u.username);

  return Response.json({ users });
}
