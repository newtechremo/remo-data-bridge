import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const t = await getTranslations();
  const locale = await getLocale();

  const [totalUsers, totalRequests, pendingRequests, completedRequests] =
    await Promise.all([
      prisma.user.count(),
      prisma.analysisRequest.count(),
      prisma.analysisRequest.count({ where: { status: "pending" } }),
      prisma.analysisRequest.count({ where: { status: "completed" } }),
    ]);

  const recentRequests = await prisma.analysisRequest.findMany({
    where: { status: "pending" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const stats = [
    { label: t("admin.stats.totalUsers"), value: totalUsers, color: "bg-purple-500" },
    { label: t("admin.stats.totalRequests"), value: totalRequests, color: "bg-blue-500" },
    { label: t("admin.stats.pendingRequests"), value: pendingRequests, color: "bg-yellow-500" },
    { label: t("admin.stats.completedRequests"), value: completedRequests, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-full`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("admin.pendingRequests")}</CardTitle>
              <Link
                href="/requests"
                className="text-sm text-blue-600 hover:underline"
              >
                {t("dashboard.viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t("admin.noPendingRequests")}
              </p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{request.title}</p>
                    <p className="text-sm text-gray-500">
                      {request.user?.name} · {t("requests.files")} {request._count.files} ·{" "}
                      {new Date(request.createdAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("admin.quickMenu")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <p className="font-medium text-gray-900">{t("admin.userManagement")}</p>
                    <p className="text-sm text-gray-500">
                      {t("admin.userManagementDescription")}
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/requests"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <p className="font-medium text-gray-900">{t("admin.allRequests")}</p>
                    <p className="text-sm text-gray-500">
                      {t("admin.allRequestsDescription")}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
