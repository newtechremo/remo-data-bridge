import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, getS3Url, generateS3Key } from "@/lib/s3";
import { z } from "zod";

const presignedSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = presignedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { filename, contentType } = parsed.data;
    const key = generateS3Key(session.user.id, filename);
    const presignedUrl = await getPresignedUploadUrl(key, contentType);
    const s3Url = getS3Url(key);

    return NextResponse.json({
      presignedUrl,
      key,
      url: s3Url,
    });
  } catch (error) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
