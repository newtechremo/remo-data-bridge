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
        files: {
          include: {
            results: true,
          },
        },
        results: true,
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

    // 관리자인 경우 이전/다음 요청 ID 조회
    let prevId: string | null = null;
    let nextId: string | null = null;

    if (session.user.role === "admin") {
      // 이전 요청: 현재보다 오래된 (createdAt이 더 작은) 중 가장 최신 것 (시간상 이전)
      const prevRequest = await prisma.analysisRequest.findFirst({
        where: {
          deletedAt: null,
          createdAt: { lt: analysisRequest.createdAt },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      prevId = prevRequest?.id || null;

      // 다음 요청: 현재보다 최신 (createdAt이 더 큰) 중 가장 오래된 것 (시간상 다음)
      const nextRequest = await prisma.analysisRequest.findFirst({
        where: {
          deletedAt: null,
          createdAt: { gt: analysisRequest.createdAt },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      nextId = nextRequest?.id || null;
    }

    return NextResponse.json({ ...analysisRequest, prevId, nextId });
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json(
      { error: "Failed to get request" },
      { status: 500 }
    );
  }
}

// PATCH: Update request status or restore deleted request
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

    // Only admin can update status or restore
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle restore action
    if (body.restore === true) {
      const restoredRequest = await prisma.analysisRequest.update({
        where: { id },
        data: { deletedAt: null },
        include: { files: true },
      });
      return NextResponse.json(restoredRequest);
    }

    // Handle status update
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

// DELETE: Soft delete request
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

    // Soft delete: set deletedAt timestamp
    await prisma.analysisRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
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
