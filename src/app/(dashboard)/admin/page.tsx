import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

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
    { label: "전체 사용자", value: totalUsers, color: "bg-purple-500" },
    { label: "전체 요청", value: totalRequests, color: "bg-blue-500" },
    { label: "대기중 요청", value: pendingRequests, color: "bg-yellow-500" },
    { label: "완료된 요청", value: completedRequests, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>

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
              <CardTitle>처리 대기중인 요청</CardTitle>
              <Link
                href="/requests"
                className="text-sm text-blue-600 hover:underline"
              >
                전체 보기
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                대기중인 요청이 없습니다
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
                      {request.user?.name} · 파일 {request._count.files}개 ·{" "}
                      {new Date(request.createdAt).toLocaleDateString("ko-KR")}
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
              <CardTitle>빠른 메뉴</CardTitle>
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
                    <p className="font-medium text-gray-900">사용자 관리</p>
                    <p className="text-sm text-gray-500">
                      사용자 추가, 역할 변경
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
                    <p className="font-medium text-gray-900">전체 요청 관리</p>
                    <p className="text-sm text-gray-500">
                      모든 사용자의 요청 조회 및 관리
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
