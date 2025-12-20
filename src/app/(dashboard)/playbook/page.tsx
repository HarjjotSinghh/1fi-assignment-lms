import {
  RiBookOpenLine,
  RiCheckboxCircleLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiShieldLine,
  RiTimeLine,
  RiUserAddLine,
  RiAlertLine,
  RiArrowRightLine,
  RiPhoneLine,
  RiMailLine,
  RiPrinterLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const workflows = [
  {
    id: "new-application",
    title: "New Loan Application",
    description: "Complete workflow for processing new loan against mutual fund applications",
    icon: <RiFileListLine className="h-5 w-5" />,
    iconColor: "bg-primary/10 text-primary",
    estimatedTime: "15-30 mins",
    steps: [
      { step: 1, title: "Customer Verification", description: "Verify customer identity through KYC process", action: "Start KYC" },
      { step: 2, title: "Collateral Verification", description: "Validate mutual fund holdings and calculate LTV", action: "Verify Holdings" },
      { step: 3, title: "Credit Assessment", description: "Review credit score and eligibility criteria", action: "Run Assessment" },
      { step: 4, title: "Loan Approval", description: "Submit application for approval workflow", action: "Submit for Approval" },
      { step: 5, title: "Lien Marking", description: "Mark lien on mutual fund units with depository", action: "Mark Lien" },
      { step: 6, title: "Disbursement", description: "Initiate fund transfer to customer account", action: "Disburse Funds" },
    ],
  },
  {
    id: "kyc-process",
    title: "KYC Verification",
    description: "Step-by-step guide for completing customer KYC verification",
    icon: <RiShieldCheckLine className="h-5 w-5" />,
    iconColor: "bg-success/10 text-success",
    estimatedTime: "5-10 mins",
    steps: [
      { step: 1, title: "Collect Documents", description: "Obtain Aadhaar and PAN card from customer", action: "Upload Documents" },
      { step: 2, title: "DigiLocker Verification", description: "Initiate DigiLocker verification for Aadhaar", action: "Start DigiLocker" },
      { step: 3, title: "PAN Verification", description: "Verify PAN details through API", action: "Verify PAN" },
      { step: 4, title: "Address Verification", description: "Confirm residential address from documents", action: "Verify Address" },
      { step: 5, title: "KYC Approval", description: "Mark KYC as verified after all checks pass", action: "Complete KYC" },
    ],
  },
  {
    id: "collateral-pledge",
    title: "Collateral Pledge Process",
    description: "Process for pledging mutual fund units as loan collateral",
    icon: <RiShieldLine className="h-5 w-5" />,
    iconColor: "bg-warning/10 text-warning",
    estimatedTime: "10-20 mins",
    steps: [
      { step: 1, title: "Fetch MF Holdings", description: "Retrieve customer's mutual fund portfolio from CAMs/KFintech", action: "Fetch Holdings" },
      { step: 2, title: "Select Units", description: "Choose units to pledge based on LTV requirements", action: "Select Units" },
      { step: 3, title: "Calculate LTV", description: "Compute loan-to-value ratio for selected collateral", action: "Calculate" },
      { step: 4, title: "Lien Request", description: "Submit lien marking request to RTA", action: "Request Lien" },
      { step: 5, title: "Confirm Pledge", description: "Verify lien confirmation from depository", action: "Confirm" },
    ],
  },
  {
    id: "disbursement",
    title: "Loan Disbursement",
    description: "Complete disbursement workflow after loan approval",
    icon: <RiMoneyDollarCircleLine className="h-5 w-5" />,
    iconColor: "bg-accent/10 text-accent",
    estimatedTime: "5-15 mins",
    steps: [
      { step: 1, title: "Verify Approval", description: "Confirm loan is in approved status", action: "Check Status" },
      { step: 2, title: "Validate Account", description: "Verify customer bank account details", action: "Verify Account" },
      { step: 3, title: "Generate Documents", description: "Create loan agreement and sanction letter", action: "Generate" },
      { step: 4, title: "Customer Signature", description: "Obtain digital signature on loan documents", action: "Get Signature" },
      { step: 5, title: "Initiate Transfer", description: "Process fund transfer via NEFT/IMPS", action: "Transfer" },
      { step: 6, title: "Confirm Disbursement", description: "Update loan status and send confirmation", action: "Confirm" },
    ],
  },
  {
    id: "collection",
    title: "EMI Collection",
    description: "Managing EMI collections and overdue handling",
    icon: <RiTimeLine className="h-5 w-5" />,
    iconColor: "bg-info/10 text-info",
    estimatedTime: "Varies",
    steps: [
      { step: 1, title: "EMI Due Reminder", description: "Send reminder 3 days before EMI due date", action: "Send Reminder" },
      { step: 2, title: "Auto-Debit", description: "Attempt NACH/auto-debit on due date", action: "Process" },
      { step: 3, title: "Payment Confirmation", description: "Verify payment received and update records", action: "Confirm" },
      { step: 4, title: "Overdue Handling", description: "Initiate collection flow if payment fails", action: "Follow Up" },
      { step: 5, title: "Margin Call", description: "Trigger margin call if LTV exceeds threshold", action: "Alert Customer" },
    ],
  },
];

const quickActions = [
  { title: "Start New Application", href: "/applications/new", icon: <RiUserAddLine className="h-4 w-4" /> },
  { title: "View Pending Approvals", href: "/approvals", icon: <RiCheckboxCircleLine className="h-4 w-4" /> },
  { title: "Check High LTV Loans", href: "/loans?status=ACTIVE", icon: <RiAlertLine className="h-4 w-4" /> },
  { title: "View Activity Log", href: "/activity", icon: <RiTimeLine className="h-4 w-4" /> },
];

export default function PlaybookPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-primary/10">
              <RiBookOpenLine className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Playbook</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Standard operating procedures and workflows for loan processing, KYC verification, and collection management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-none gap-2">
            <RiPrinterLine className="h-4 w-4" />
            Print All
          </Button>
        </div>
      </section>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          <CardDescription>Common tasks you can start right away</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="justify-start gap-2 h-auto py-3 rounded-none"
                asChild
              >
                <Link href={action.href}>
                  {action.icon}
                  {action.title}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflows Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-none ${workflow.iconColor}`}>
                    {workflow.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">{workflow.title}</CardTitle>
                    <CardDescription className="mt-1">{workflow.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {workflow.estimatedTime}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Separator />
              <div className="p-4 space-y-3">
                {workflow.steps.map((step, index) => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {step.step}
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-border absolute top-6 min-h-[24px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Need Help?</CardTitle>
          <CardDescription>
            Contact support for workflow assistance or custom process requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="gap-2 rounded-none">
              <RiPhoneLine className="h-4 w-4" />
              Call Support
            </Button>
            <Button variant="outline" className="gap-2 rounded-none">
              <RiMailLine className="h-4 w-4" />
              Email Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
