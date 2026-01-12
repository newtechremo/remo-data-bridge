import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fileResultSchema = z.object({
  // 다국어 결과 텍스트
  results: z.object({
    ko: z.string().optional(),
    en: z.string().optional(),
    th: z.string().optional(),
  }).optional(),
  analysisResultFileUrl: z.string().optional(),
  // 하위 호환성
  analysisResult: z.string().optional(),
});

// PATCH: Add/Update file analysis result (다국어 지원)
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

    const { results, analysisResultFileUrl, analysisResult } = parsed.data;

    // 다국어 결과 upsert
    const locales = ["ko", "en", "th"] as const;
    const resultUpserts = [];

    if (results) {
      for (const locale of locales) {
        const text = results[locale];
        if (text !== undefined && text.trim() !== "") {
          resultUpserts.push(
            prisma.uploadedFileResult.upsert({
              where: {
                fileId_locale: {
                  fileId: id,
                  locale,
                },
              },
              update: { text },
              create: {
                fileId: id,
                locale,
                text,
              },
            })
          );
        } else if (text === "") {
          // 빈 문자열이면 삭제
          resultUpserts.push(
            prisma.uploadedFileResult.deleteMany({
              where: {
                fileId: id,
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
      prisma.uploadedFile.update({
        where: { id },
        data: {
          ...(analysisResult !== undefined && { analysisResult: analysisResult || null }),
          ...(analysisResultFileUrl !== undefined && { analysisResultFileUrl: analysisResultFileUrl || null }),
        },
      }),
    ]);

    // 업데이트된 결과 조회
    const updatedFile = await prisma.uploadedFile.findUnique({
      where: { id },
      include: {
        results: true,
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
