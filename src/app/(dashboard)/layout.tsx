import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col">
          <Header user={session.user} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
