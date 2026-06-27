"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, ImagePlus } from "lucide-react";

interface ImageUploaderProps {
  projectId: string;
  onUploadComplete: () => void;
}

export default function ImageUploader({
  projectId,
  onUploadComplete,
}: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      try {
        const res = await fetch(`/api/projects/${projectId}/images`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setUploadProgress(100);
          onUploadComplete();
        } else {
          console.error("Upload failed");
        }
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    },
    [projectId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  return (
    <div>
      <div
        className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid var(--border-primary)",
                borderTopColor: "var(--accent-primary)",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Uploading images...
            </p>
            <div className="progress-bar" style={{ maxWidth: 200 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: 0.5,
              }}
            >
              <Camera size={36} strokeWidth={1.5} />
              <ImagePlus size={36} strokeWidth={1.5} />
              <Upload size={36} strokeWidth={1.5} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {isDragActive
                  ? "Drop images here!"
                  : "Drag & drop worksheet photos here"}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                or click to browse • Supports JPG, PNG, WEBP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
