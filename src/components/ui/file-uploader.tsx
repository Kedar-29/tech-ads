// components/ui/file-uploader.tsx
"use client";

import { useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone";

interface FileUploaderProps {
  accept?: Accept;
  maxSize?: number;
  selectedFile?: File | null;
  onFilesSelected: (files: File[]) => void;
}

export function FileUploader({
  accept = { "video/*": [] },
  maxSize,
  selectedFile,
  onFilesSelected,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="w-full p-6 border-2 border-dashed rounded-lg cursor-pointer text-center bg-muted hover:bg-muted/60 transition"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here...</p>
      ) : selectedFile ? (
        <p className="text-green-600 font-medium">{selectedFile.name}</p>
      ) : (
        <p>Drag and drop or click to select a video file</p>
      )}
    </div>
  );
}
