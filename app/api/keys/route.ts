import { getSession } from "@/lib/session";
import { registerIdentityKey } from "@/lib/keyRegistry";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { publicKey } = (await req.json()) as { publicKey: string };
  if (!publicKey) return Response.json({ error: "Missing publicKey" }, { status: 400 });
  registerIdentityKey(session.username, publicKey);
  return Response.json({ ok: true });
}
