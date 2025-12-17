"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count?: {
    analysisRequests: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("사용자 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "사용자 생성에 실패했습니다");
      }

      toast.success("사용자가 생성되었습니다");
      setShowForm(false);
      setFormData({ email: "", password: "", name: "", role: "user" });
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "사용자 생성에 실패했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "역할 변경에 실패했습니다");
      }

      toast.success("역할이 변경되었습니다");
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "역할 변경에 실패했습니다"
      );
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말 ${userName} 사용자를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "삭제에 실패했습니다");
      }

      toast.success("사용자가 삭제되었습니다");
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제에 실패했습니다"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "사용자 추가"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 사용자 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="email"
                  type="email"
                  label="이메일"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <Input
                  id="password"
                  type="password"
                  label="비밀번호"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <Input
                  id="name"
                  label="이름"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    역할
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="user">일반 사용자</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
              </div>
              <Button type="submit" isLoading={isSubmitting}>
                사용자 생성
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩중...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              사용자가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      이름
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      이메일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      역할
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      요청 수
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      가입일
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <select
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateRole(user.id, e.target.value)
                          }
                        >
                          <option value="user">일반 사용자</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user._count?.analysisRequests || 0}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
