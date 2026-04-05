import { getSession } from "@/lib/session";
import { getIdentityKey } from "@/lib/keyRegistry";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { username } = await params;
  const publicKey = getIdentityKey(username);
  if (!publicKey) return Response.json({ error: "Key not found" }, { status: 404 });
  return Response.json({ publicKey });
}
