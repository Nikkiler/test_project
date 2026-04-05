import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Chat from "@/components/Chat";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Chat username={session.username} isAdmin={session.isAdmin} />;
}
