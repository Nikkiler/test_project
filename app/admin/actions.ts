"use server";

import { createUser, deleteUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/");
}

export async function addUserAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();

  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  const result = createUser(username, password);
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return {};
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const username = (formData.get("username") as string)?.trim();
  if (!username || !/^[a-zA-Z0-9_-]{2,32}$/.test(username)) return;
  deleteUser(username);
  revalidatePath("/admin");
}
