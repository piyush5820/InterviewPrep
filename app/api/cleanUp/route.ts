import { NextResponse } from "next/server";
import { deleteOldDocuments } from "@/firebase/cleanup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CLEANUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedCount = await deleteOldDocuments("interviews", 7);
    return NextResponse.json({ message: `Deleted ${deletedCount} old documents`, deletedCount }, { status: 200 });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Failed to clean up old documents" }, { status: 500 });
  }
}