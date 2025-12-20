import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const SUPER_ADMIN_EMAIL = "harjjotsinghh@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is logged in and is the super admin
  if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
    redirect("/dashboard?error=unauthorized");
  }

  return <>{children}</>;
}
