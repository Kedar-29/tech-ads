"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  fileUrl: string;
}

export default function AdEditForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      try {
        setLoading(true);
        const res = await fetch(`/api/ads/${id}`);
        if (!res.ok) throw new Error("Failed to fetch ad");
        const data: Ad = await res.json();
        setTitle(data.title);
        setExistingFileUrl(data.fileUrl);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [id]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit");
      return;
    }
    setFile(selected);
  }

  function clearSelectedFile() {
    setFile(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    if (file) formData.append("file", file);

    try {
      setSaving(true);
      const res = await fetch(`/api/ads/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update ad");
      }
      toast.success("Ad updated");
      router.push("/roles/agency/ads");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        Loading ad details...
      </div>
    );

  return (
    <Card className="max-w-lg mx-auto mt-10">
      <CardHeader>
        <CardTitle>Edit Advertisement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title input */}
          <div>
            <Label htmlFor="title" className="font-semibold">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ad title"
              disabled={saving}
              required
              autoFocus
            />
          </div>

          {/* Existing Video */}
          <div>
            <Label className="font-semibold mb-1 block">Current Video</Label>
            {existingFileUrl ? (
              <video
                src={existingFileUrl}
                controls
                width="100%"
                className="rounded-md border border-neutral-200"
                preload="metadata"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No video available
              </p>
            )}
          </div>

          {/* New file input */}
          <div>
            <Label htmlFor="file" className="font-semibold">
              Replace Video (optional)
            </Label>
            <Input
              id="file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={saving}
            />
            {file && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <p className="truncate max-w-xs">{file.name}</p>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="text-red-500 hover:underline focus:outline-none"
                  disabled={saving}
                  aria-label="Clear selected file"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
