"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileUploader } from "@/components/ui/file-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Ad {
  id: string;
  title: string;
  fileUrl: string;
  agencyId: string;
}

interface UploadSuccess {
  success: true;
  ad: Ad;
}

interface UploadError {
  error: string;
}

export default function UploadAdComponent() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (files: File[]) => {
    const selected = files[0];
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit");
      return;
    }
    setFile(selected);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title || !file) {
      toast.error("Title and video file are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await fetch("/api/ads/upload", {
        method: "POST",
        body: formData,
      });
      const data: UploadSuccess | UploadError = await res.json();

      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Upload failed");
      }

      toast.success("Ad uploaded successfully!");
      setTitle("");
      setFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 p-4">
      <CardHeader>
        <CardTitle>Upload New Advertisement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Ad Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your ad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Video File</Label>
            <FileUploader
              accept={{ "video/*": [] }}
              maxSize={50 * 1024 * 1024}
              onFilesSelected={handleFileSelect}
              selectedFile={file}
            />
          </div>

          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload Ad"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
