import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  localMealPhotoAbsolutePath,
  parseLocalMealPhotoFilename,
} from "@/lib/meal-photos";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await context.params;
  const parsed = parseLocalMealPhotoFilename(filename);
  if (!parsed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = parsed.userId === user.id;
  if (!isOwner && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const abs = localMealPhotoAbsolutePath(parsed.filename);
  if (!abs) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await fs.readFile(abs);
    const ext = parsed.filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
