import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const where = isAdmin ? {} : { userId: session?.user?.id };

  const [totalRequests, pendingRequests, completedRequests, recentRequests] =
    await Promise.all([
      prisma.analysisRequest.count({ where }),
      prisma.analysisRequest.count({ where: { ...where, status: "pending" } }),
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
    { label: "전체 요청", value: totalRequests, color: "bg-blue-500" },
    { label: "대기중", value: pendingRequests, color: "bg-yellow-500" },
    { label: "완료", value: completedRequests, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Card>
        <CardHeader>
          <CardTitle>최근 요청</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 요청이 없습니다.{" "}
              <Link href="/requests/new" className="text-blue-600 hover:underline">
                새 요청 만들기
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isAdmin && request.user?.name && `${request.user.name} · `}
                        파일 {request._count.files}개 ·{" "}
                        {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        request.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : request.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {request.status === "completed"
                        ? "완료"
                        : request.status === "in_progress"
                        ? "진행중"
                        : "대기중"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
