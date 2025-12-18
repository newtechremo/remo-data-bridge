import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const t = await getTranslations();
  const locale = await getLocale();

  const where = isAdmin ? {} : { userId: session?.user?.id };

  const [totalRequests, pendingRequests, inProgressRequests, completedRequests, recentRequests] =
    await Promise.all([
      prisma.analysisRequest.count({ where }),
      prisma.analysisRequest.count({ where: { ...where, status: "pending" } }),
      prisma.analysisRequest.count({ where: { ...where, status: "in_progress" } }),
      prisma.analysisRequest.count({ where: { ...where, status: "completed" } }),
      prisma.analysisRequest.findMany({
        where,
        include: {
          user: { select: { name: true } },
          _count: { select: { files: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: t("dashboard.totalRequests"), value: totalRequests, icon: "chart", color: "primary" },
    { label: t("dashboard.pendingRequests"), value: pendingRequests, icon: "clock", color: "blue" },
    { label: t("dashboard.inProgressRequests"), value: inProgressRequests, icon: "progress", color: "purple" },
    { label: t("dashboard.completedRequests"), value: completedRequests, icon: "check", color: "green" },
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed": return "badge badge-completed";
      case "in_progress": return "badge badge-in-progress";
      case "pending": return "badge badge-pending";
      default: return "badge badge-cancelled";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-[900] tracking-tight text-primary">{t("dashboard.title")}</h1>
        <p className="text-slate-500 mt-1">{t("dashboard.welcome")}, {session?.user?.name || session?.user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-3xl font-[900] text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.color === "primary" ? "bg-primary/10" :
                stat.color === "blue" ? "bg-blue-50" :
                stat.color === "purple" ? "bg-purple-50" : "bg-green-50"
              }`}>
                {stat.icon === "chart" && (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
                {stat.icon === "clock" && (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {stat.icon === "progress" && (
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {stat.icon === "check" && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="card-header-title">{t("dashboard.recentRequests")}</h2>
          <Link href="/requests" className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent-dark transition-colors">
            {t("dashboard.viewAll")}
          </Link>
        </div>
        <div className="card-body p-0">
          {recentRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm italic uppercase tracking-wider">{t("requests.noRequests")}</p>
              <Link href="/requests/new" className="inline-block mt-4 text-accent hover:text-accent-dark font-bold text-sm uppercase tracking-wider">
                {t("nav.newRequest")}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="table-row flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{request.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAdmin && request.user?.name && `${request.user.name} · `}
                        {request._count.files} {t("requests.files")} · {new Date(request.createdAt).toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "th" ? "th-TH" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <span className={getStatusBadgeClass(request.status)}>
                    {t(`status.${request.status}`)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
