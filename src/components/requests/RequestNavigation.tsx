"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// SVG 아이콘 컴포넌트
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

interface RequestNavigationProps {
  prevId: string | null | undefined;
  nextId: string | null | undefined;
  onContentClick?: () => void;
}

export default function RequestNavigation({
  prevId,
  nextId,
  onContentClick,
}: RequestNavigationProps) {
  const router = useRouter();
  const t = useTranslations("requests.detail");
  const [mobileVisible, setMobileVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 모바일: 스크롤 감지
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤 중이면 표시
      setMobileVisible(true);

      // 스크롤 멈추면 3초 후 숨김
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMobileVisible(false);
      }, 3000);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [lastScrollY]);

  // 콘텐츠 클릭 시 모바일 네비게이션 숨김
  const handleContentClick = useCallback(() => {
    setMobileVisible(false);
    onContentClick?.();
  }, [onContentClick]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 동작 안함
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && prevId) {
        router.push(`/requests/${prevId}`);
      } else if (e.key === "ArrowRight" && nextId) {
        router.push(`/requests/${nextId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevId, nextId, router]);

  const hasPrev = !!prevId;
  const hasNext = !!nextId;

  // 이전/다음 모두 없으면 렌더링 안함
  if (!hasPrev && !hasNext) {
    return null;
  }

  return (
    <>
      {/* PC: 좌우 고정 화살표 */}
      {hasPrev && (
        <button
          onClick={() => router.push(`/requests/${prevId}`)}
          className="hidden lg:flex fixed left-4 xl:left-[calc(50%-32rem-80px)] top-1/2 -translate-y-1/2 z-40
            w-12 h-12 items-center justify-center
            bg-white border border-gray-200 rounded-full shadow-lg
            hover:bg-gray-50 hover:border-gray-300 hover:shadow-xl
            transition-all duration-200 group"
          title={t("prevRequest")}
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={() => router.push(`/requests/${nextId}`)}
          className="hidden lg:flex fixed right-4 xl:right-[calc(50%-32rem-80px)] top-1/2 -translate-y-1/2 z-40
            w-12 h-12 items-center justify-center
            bg-white border border-gray-200 rounded-full shadow-lg
            hover:bg-gray-50 hover:border-gray-300 hover:shadow-xl
            transition-all duration-200 group"
          title={t("nextRequest")}
        >
          <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
        </button>
      )}

      {/* 모바일: 하단 플로팅 바 */}
      <div
        className={`lg:hidden fixed bottom-4 left-4 right-4 z-40
          flex items-center justify-between gap-2 p-2
          bg-white/95 backdrop-blur border border-gray-200 rounded-full shadow-lg
          transition-all duration-300
          ${mobileVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {hasPrev ? (
          <button
            onClick={() => router.push(`/requests/${prevId}`)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700
              hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t("prevRequest")}</span>
            <span className="sm:hidden">{t("prev")}</span>
          </button>
        ) : (
          <div className="w-20" />
        )}

        <div className="flex-1 text-center">
          <button
            onClick={handleContentClick}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t("tapToClose")}
          </button>
        </div>

        {hasNext ? (
          <button
            onClick={() => router.push(`/requests/${nextId}`)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700
              hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="hidden sm:inline">{t("nextRequest")}</span>
            <span className="sm:hidden">{t("next")}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </>
  );
}
