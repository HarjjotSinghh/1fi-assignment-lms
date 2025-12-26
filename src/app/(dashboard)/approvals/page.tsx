import { ApprovalsList } from "./components/approvals-list";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Approvals | LMS",
  description: "Manage pending approval requests",
};

export default async function ApprovalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Approvals</h2>
          <p className="text-muted-foreground">
            Review and take action on pending requests
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ApprovalsList userId={session.user.id} />
      </div>
    </div>
  );
}
