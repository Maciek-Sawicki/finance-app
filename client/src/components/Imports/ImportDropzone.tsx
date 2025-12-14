"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ImportService } from "@/services/imports";
import { useAccounts } from "@/contexts/AccountsContext";

export default function ImportDropzone({
  onUploadSuccess,
}: {
  onUploadSuccess?: () => void;
}) {
  const { accounts } = useAccounts();

  const [accountId, setAccountId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !accountId) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await ImportService.uploadCsv(accountId, file);
      setFile(null);
      setSuccess("Upload successful! Transactions have been imported.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadSuccess?.();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "An error occurred during file upload.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Select account</label>
          <Select onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account for import" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id}>
                  {acc.name} ({acc.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {accountId && (
          <div className="flex flex-col items-center gap-4 border border-dashed rounded-xl p-6">
            <Upload className="w-10 h-10 text-muted-foreground" />

            <p className="text-sm text-muted-foreground text-center">
              Click to select a CSV file.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV file
            </Button>

            {file && (
              <p className="text-xs text-muted-foreground">
                Selected file: <strong>{file.name}</strong>
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload your CSV file"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
