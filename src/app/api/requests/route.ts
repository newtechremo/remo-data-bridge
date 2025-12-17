import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRequestSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  files: z.array(
    z.object({
      originalFilename: z.string(),
      s3Key: z.string(),
      s3Url: z.string().url(),
      fileSize: z.number(),
      mimeType: z.string().optional(),
    })
  ),
});

// GET: List requests
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Admin can see all requests, users can only see their own
    if (session.user.role !== "admin") {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.analysisRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          files: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.analysisRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Failed to get requests" },
      { status: 500 }
    );
  }
}

// POST: Create new request
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { title, files } = parsed.data;

    const analysisRequest = await prisma.analysisRequest.create({
      data: {
        title,
        userId: session.user.id,
        files: {
          create: files.map((file) => ({
            originalFilename: file.originalFilename,
            s3Key: file.s3Key,
            s3Url: file.s3Url,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          })),
        },
      },
      include: {
        files: true,
      },
    });

    return NextResponse.json(analysisRequest, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
