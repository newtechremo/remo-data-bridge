import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const resultSchema = z.object({
  // 다국어 결과 텍스트
  results: z.object({
    ko: z.string().optional(),
    en: z.string().optional(),
    th: z.string().optional(),
  }).optional(),
  resultFileUrl: z.string().optional().transform(val => val === "" ? undefined : val).pipe(z.string().url().optional()),
  // 하위 호환성을 위해 기존 필드도 지원
  resultText: z.string().optional(),
});

// PATCH: Add/Update analysis result (다국어 지원)
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
    const parsed = resultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.analysisRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const { results, resultFileUrl, resultText } = parsed.data;

    // 다국어 결과 upsert
    const locales = ["ko", "en", "th"] as const;
    const resultUpserts = [];

    if (results) {
      for (const locale of locales) {
        const text = results[locale];
        if (text !== undefined && text.trim() !== "") {
          resultUpserts.push(
            prisma.analysisRequestResult.upsert({
              where: {
                requestId_locale: {
                  requestId: id,
                  locale,
                },
              },
              update: { text },
              create: {
                requestId: id,
                locale,
                text,
              },
            })
          );
        } else if (text === "") {
          // 빈 문자열이면 삭제
          resultUpserts.push(
            prisma.analysisRequestResult.deleteMany({
              where: {
                requestId: id,
                locale,
              },
            })
          );
        }
      }
    }

    // 트랜잭션으로 실행
    await prisma.$transaction([
      ...resultUpserts,
      prisma.analysisRequest.update({
        where: { id },
        data: {
          resultText, // 하위 호환성
          resultFileUrl,
          resultCreatedAt: new Date(),
          status: "completed",
        },
      }),
    ]);

    // 업데이트된 결과 조회
    const updatedRequest = await prisma.analysisRequest.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            results: true,
          },
        },
        results: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Update result error:", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}
