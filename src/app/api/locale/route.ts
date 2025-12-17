import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { locales, type Locale } from "@/i18n/config";

export async function POST(request: Request) {
  try {
    const { locale } = await request.json();

    if (!locales.includes(locale as Locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error("Set locale error:", error);
    return NextResponse.json(
      { error: "Failed to set locale" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "ko";

  return NextResponse.json({ locale });
}
