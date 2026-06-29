"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Wand2,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import SortableImageGrid, {
  ImageItem,
} from "@/components/SortableImageGrid";
import { SubjectBadge, StatusBadge } from "@/components/StatusBadge";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  subject: string;
  status: string;
  description: string | null;
  images: ImageItem[];
}

export default function ProjectEditor() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStatus, setGenerateStatus] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExt, setDownloadExt] = useState<"docx" | "xlsx">("docx");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setImages(
          data.images.sort(
            (a: ImageItem, b: ImageItem) => a.orderIndex - b.orderIndex
          )
        );
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleReorder = async (reorderedImages: ImageItem[]) => {
    setImages(reorderedImages);
    try {
      await fetch(`/api/projects/${projectId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: reorderedImages.map((img) => ({
            id: img.id,
            orderIndex: img.orderIndex,
          })),
        }),
      });
    } catch (err) {
      console.error("Failed to save order:", err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/images?imageId=${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setImages((prev) =>
          prev
            .filter((img) => img.id !== imageId)
            .map((img, idx) => ({ ...img, orderIndex: idx }))
        );
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const handleGenerate = async (format: "doc" | "excel") => {
    if (images.length === 0) return;

    setGenerating(true);
    setGenerateProgress(10);
    setGenerateStatus(`Starting OCR processing for ${format === "excel" ? "Spreadsheet" : "Document"}...`);
    setError(null);
    setDownloadUrl(null);

    try {
      setGenerateProgress(20);
      setGenerateStatus(`Processing ${images.length} images with AI...`);

      const ocrEngine = localStorage.getItem("ocr_engine") || "groq";
      const ocrSpaceApiKey = localStorage.getItem("ocr_space_api_key") || "";
      const groqApiKey = localStorage.getItem("groq_api_key") || "";

      setGenerateStatus(
        ocrEngine === "direct" 
          ? `Inserting ${images.length} images into ${format === "excel" ? "Spreadsheet" : "Word document"}...`
          : `Processing ${images.length} images with OCR...`
      );

      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ocrEngine, ocrSpaceApiKey, groqApiKey, outputFormat: format }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Generation failed");
      }

      setGenerateProgress(90);
      setGenerateStatus(`Preparing ${format === "excel" ? "Spreadsheet" : "document"} for download...`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadExt(format === "excel" ? "xlsx" : "docx");

      setGenerateProgress(100);
      setGenerateStatus(`${format === "excel" ? "Spreadsheet" : "Document"} ready!`);

      // Update project status
      setProject((prev) =>
        prev ? { ...prev, status: "COMPLETED" } : null
      );
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : `Failed to generate ${format === "excel" ? "spreadsheet" : "document"}`;
      setError(errMsg);
      setGenerateStatus("");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !project) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${project.name.replace(/[^a-zA-Z0-9\u0900-\u097F ]/g, "_")}.${downloadExt}`;
    a.click();
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid var(--border-primary)",
              borderTopColor: "var(--accent-primary)",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: 13,
              marginBottom: 16,
              padding: "6px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-card)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft size={14} />
            Back to Projects
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>
                  {project.name}
                </h1>
                <SubjectBadge subject={project.subject} />
                <StatusBadge status={project.status} />
              </div>
              {project.description && (
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  {project.description}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {downloadUrl && (
                <button
                  className="glow-button"
                  onClick={handleDownload}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                  }}
                >
                  <Download size={16} />
                  Download .{downloadExt}
                </button>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleGenerate("doc")}
                  disabled={images.length === 0 || generating}
                  style={{
                    background:
                      images.length > 0 && !generating
                        ? "var(--accent-primary)"
                        : "var(--border-primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor:
                      images.length > 0 && !generating
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={18} />
                  Generate Document
                </button>

                <button
                  onClick={() => handleGenerate("excel")}
                  disabled={images.length === 0 || generating}
                  style={{
                    background:
                      images.length > 0 && !generating
                        ? "#107c41" // Excel green
                        : "var(--border-primary)",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor:
                      images.length > 0 && !generating
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={18} />
                  Generate Sheet
                </button>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {(generating || generateStatus) && (
          <div
            className="glass-card"
            style={{ padding: 20, marginBottom: 24 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {generating ? (
                <Loader2
                  size={18}
                  color="var(--accent-primary)"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : generateProgress === 100 ? (
                <CheckCircle2 size={18} color="var(--success)" />
              ) : null}
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                {generateStatus}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${generateProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertCircle size={18} color="var(--error)" />
            <span style={{ fontSize: 14, color: "#f87171" }}>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--text-secondary)",
            }}
          >
            Upload Worksheet Photos
          </h2>
          <ImageUploader
            projectId={projectId}
            onUploadComplete={fetchProject}
          />
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 4,
                color: "var(--text-secondary)",
              }}
            >
              Worksheet Pages ({images.length})
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 16,
              }}
            >
              Drag to reorder pages • Click preview to enlarge • Pages will
              be processed in this order
            </p>
            <SortableImageGrid
              images={images}
              projectId={projectId}
              onReorder={handleReorder}
              onDelete={handleDeleteImage}
              onPreview={setPreviewImage}
            />
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="preview-modal"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: 8,
              cursor: "pointer",
              color: "white",
              zIndex: 10,
            }}
          >
            <X size={20} />
          </button>
          <img src={previewImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}
