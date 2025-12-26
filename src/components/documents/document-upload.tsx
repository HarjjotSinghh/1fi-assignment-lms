"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileIcon, Trash2Icon, UploadCloudIcon, CheckCircle2 } from "lucide-react";
import { uploadDocumentAction, deleteDocumentAction } from "@/app/actions/documents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    entityId: string;
    entityType: "APPLICATION" | "LOAN" | "CUSTOMER";
    customerId: string;
    existingDocuments?: any[];
}

export function DocumentUpload({ entityId, entityType, customerId, existingDocuments = [] }: DocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [docType, setDocType] = useState("OTHER");

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("type", docType);
        formData.append("name", selectedFile.name);
        formData.append("customerId", customerId);

        if (entityType === "APPLICATION") formData.append("applicationId", entityId);
        if (entityType === "LOAN") formData.append("loanId", entityId);

        const res = await uploadDocumentAction(formData);

        if (res.success) {
            toast.success("Document uploaded successfully");
            setSelectedFile(null);
        } else {
            toast.error("Failed to upload document");
        }
        setIsUploading(false);
    }

    async function handleDelete(id: string) {
        const res = await deleteDocumentAction(id, window.location.pathname);
        if (res.success) {
            toast.success("Document deleted");
        } else {
            toast.error("Failed to delete document");
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Upload Form */}
                <form onSubmit={handleUpload} className="grid w-full items-end gap-4 md:grid-cols-3">
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="docType">Document Type</Label>
                        <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger id="docType">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AADHAAR">Aadhaar Card</SelectItem>
                                <SelectItem value="PAN">PAN Card</SelectItem>
                                <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                                <SelectItem value="SALARY_SLIP">Salary Slip</SelectItem>
                                <SelectItem value="ITR">ITR Verification</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="file">File</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                    </div>

                    <Button type="submit" disabled={!selectedFile || isUploading}>
                        {isUploading ? "Uploading..." : "Upload Document"}
                    </Button>
                </form>

                {/* Documents List */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Uploaded Documents</h4>
                    {existingDocuments.length === 0 ? (
                        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-muted">
                            <UploadCloudIcon className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {existingDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 border rounded-md group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileIcon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">{doc.type} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        {doc.verified && (
                                            <div className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDelete(doc.id)}>
                                        <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
