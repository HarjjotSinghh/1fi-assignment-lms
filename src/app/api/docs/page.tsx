"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/openapi-spec";

// Dynamic import to avoid SSR issues with SwaggerUI
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Explore and test the 1fi LMS API endpoints.
          </p>
        </div>
        <div className="p-4 bg-white">
          <SwaggerUI spec={openApiSpec} />
        </div>
      </div>
    </div>
  );
}
