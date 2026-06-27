"use client";

import Link from "next/link";
import { Image as ImageIcon, Calendar, Trash2, ArrowRight } from "lucide-react";
import { SubjectBadge, StatusBadge } from "./StatusBadge";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    subject: string;
    status: string;
    description?: string | null;
    createdAt: string;
    _count?: { images: number };
  };
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const imageCount = project._count?.images || 0;
  const date = new Date(project.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Top gradient accent */}
      <div
        style={{
          height: 3,
          background:
            project.subject === "HINDI"
              ? "linear-gradient(90deg, #f97316, #fb923c)"
              : project.subject === "MATHS"
              ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
              : project.subject === "ENGLISH"
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "var(--accent-gradient)",
        }}
      />

      <div style={{ padding: "20px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SubjectBadge subject={project.subject} />
            <StatusBadge status={project.status} />
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("Delete this project and all its images?")) {
                onDelete(project.id);
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              transition: "all 0.2s",
            }}
            title="Delete project"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--error)";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "none";
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 17,
            fontWeight: 600,
            marginBottom: 6,
            lineHeight: 1.3,
            color: "var(--text-primary)",
          }}
        >
          {project.name}
        </h3>

        {/* Description */}
        {project.description && (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 12,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border-primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <span
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <ImageIcon size={14} />
              {imageCount} image{imageCount !== 1 ? "s" : ""}
            </span>
            <span
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <Calendar size={14} />
              {date}
            </span>
          </div>

          <Link
            href={`/projects/${project.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--accent-primary)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(108, 92, 231, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Open
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
