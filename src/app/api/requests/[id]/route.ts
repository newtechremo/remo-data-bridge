import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteS3Object } from "@/lib/s3";

// GET: Get single request
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

    const analysisRequest = await prisma.analysisRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        files: true,
      },
    });

    if (!analysisRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check permission: user can only see their own requests
    if (
      session.user.role !== "admin" &&
      analysisRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(analysisRequest);
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json(
      { error: "Failed to get request" },
      { status: 500 }
    );
  }
}

// PATCH: Update request status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingRequest = await prisma.analysisRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only admin can update status
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedRequest = await prisma.analysisRequest.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        files: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

// DELETE: Delete request
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingRequest = await prisma.analysisRequest.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    if (
      session.user.role !== "admin" &&
      existingRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete files from S3
    for (const file of existingRequest.files) {
      try {
        await deleteS3Object(file.s3Key);
      } catch (e) {
        console.error("Failed to delete S3 object:", e);
      }
    }

    // Delete request (cascades to files)
    await prisma.analysisRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete request error:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
