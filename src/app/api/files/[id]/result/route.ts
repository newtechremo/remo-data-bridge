import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fileResultSchema = z.object({
  analysisResult: z.string().optional(),
  analysisResultFileUrl: z.string().optional(),
});

// PATCH: Add/Update file analysis result
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can add results
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = fileResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existingFile = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { analysisResult, analysisResultFileUrl } = parsed.data;

    const updatedFile = await prisma.uploadedFile.update({
      where: { id },
      data: {
        ...(analysisResult !== undefined && { analysisResult }),
        ...(analysisResultFileUrl !== undefined && { analysisResultFileUrl }),
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Update file result error:", error);
    return NextResponse.json(
      { error: "Failed to update file result" },
      { status: 500 }
    );
  }
}
