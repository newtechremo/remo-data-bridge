"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  memo?: string;
  createdAt: string;
  _count?: {
    analysisRequests: number;
  };
}

export default function UsersPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    memo: "",
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
      toast.error(t("users.addError"));
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
        throw new Error(error.error || t("users.addError"));
      }
      toast.success(t("users.addSuccess"));
      setShowForm(false);
      setFormData({ email: "", password: "", name: "", role: "user" });
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("users.addError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({ name: user.name, memo: user.memo || "" });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("common.error"));
      }
      toast.success(t("users.updateSuccess"));
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
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
        throw new Error(error.error || t("common.error"));
      }
      toast.success(t("users.roleChangeSuccess"));
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("users.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("common.error"));
      }
      toast.success(t("users.deleteSuccess"));
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("users.title")}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("common.cancel") : t("users.addUser")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t("users.addUserTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input id="email" type="email" label={t("users.email")} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <Input id="password" type="password" label={t("users.password")} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                <Input id="name" label={t("users.name")} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("users.role")}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="user">{t("users.roleUser")}</option>
                    <option value="admin">{t("users.roleAdmin")}</option>
                  </select>
                </div>
              </div>
              <Button type="submit" isLoading={isSubmitting}>{t("users.createButton")}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {editingUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("users.editUserTitle")}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>{t("common.close")}</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("users.email")}</label>
                  <p className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">{editingUser.email}</p>
                </div>
                <Input id="edit-name" label={t("users.name")} value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("users.memo")}</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} value={editFormData.memo} onChange={(e) => setEditFormData({ ...editFormData, memo: e.target.value })} placeholder={t("users.memoPlaceholder")} />
              </div>
              <Button type="submit" isLoading={isSubmitting}>{t("common.save")}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("users.list")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t("common.loading")}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t("users.noUsers")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.name")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.email")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.memo")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.role")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.requests")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.createdAt")}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">{t("users.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={user.memo}>{user.memo || "-"}</td>
                      <td className="py-3 px-4">
                        <select className="px-2 py-1 border border-gray-300 rounded text-sm" value={user.role} onChange={(e) => handleUpdateRole(user.id, e.target.value)}>
                          <option value="user">{t("users.roleUser")}</option>
                          <option value="admin">{t("users.roleAdmin")}</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user._count?.analysisRequests || 0}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleEditUser(user)}>{t("common.edit")}</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>{t("common.delete")}</Button>
                        </div>
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
