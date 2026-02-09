import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { path, secret } = await request.json();

    if (!secret || secret !== process.env.REVALIDATION_SECRET) {
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (!path) {
      return Response.json({ error: "Path is required" }, { status: 400 });
    }

    revalidatePath(path);
    return Response.json({ revalidated: true, path });
  } catch (error) {
    return Response.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
