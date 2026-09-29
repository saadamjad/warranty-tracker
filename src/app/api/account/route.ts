import { NextResponse } from "next/server";
import { jsonError, sessionUserId } from "@/lib/server/http";
import { deleteAccount } from "@/lib/server/repo";

/** Permanently deletes the signed-in account and its backup (BR-07). */
export async function DELETE() {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to delete your account.");
  try {
    await deleteAccount(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("account deletion failed", { userId, error });
    return jsonError(500, "Your account couldn't be deleted right now. Please try again.");
  }
}
