import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/s3";

// GET: Get presigned download URL for a file
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "admin";

    // Find file with request info
    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check permission: admin can access all, users can only access their own
    if (!isAdmin && file.request.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const downloadUrl = await getPresignedDownloadUrl(file.s3Key);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Get download URL error:", error);
    return NextResponse.json(
      { error: "Failed to get download URL" },
      { status: 500 }
    );
  }
}
