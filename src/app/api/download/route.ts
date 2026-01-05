import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedDownloadUrl } from "@/lib/s3";

// POST: Get presigned download URL from S3 URL or key
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { s3Url, s3Key, filename } = body;

    if (!s3Url && !s3Key) {
      return NextResponse.json(
        { error: "s3Url or s3Key is required" },
        { status: 400 }
      );
    }

    let key = s3Key;

    // Extract key from S3 URL if provided
    if (s3Url && !s3Key) {
      const bucket = process.env.AWS_S3_BUCKET!;
      const region = process.env.AWS_REGION!;
      const urlPattern = new RegExp(
        `https://${bucket}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`
      );
      const match = s3Url.match(urlPattern);

      if (match) {
        key = decodeURIComponent(match[1]);
      } else {
        return NextResponse.json(
          { error: "Invalid S3 URL format" },
          { status: 400 }
        );
      }
    }

    const downloadUrl = await getPresignedDownloadUrl(key, filename);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Get download URL error:", error);
    return NextResponse.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    );
  }
}
