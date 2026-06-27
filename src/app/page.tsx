"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, FileText, Sparkles, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import NewProjectDialog from "@/components/NewProjectDialog";

interface Project {
  id: string;
  name: string;
  subject: string;
  status: string;
  description: string | null;
  createdAt: string;
  _count: { images: number };
}

const SUBJECT_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "HINDI", label: "हिन्दी" },
  { value: "MATHS", label: "Maths" },
  { value: "ENGLISH", label: "English" },
  { value: "SCIENCE", label: "Science" },
  { value: "PHYSICS", label: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "OTHER", label: "Other" },
];

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "ALL" || p.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero Section */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              Your Projects
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              Scan worksheets, reorder pages, and generate editable Word
              documents
            </p>
          </div>

          <button
            className="glow-button"
            onClick={() => setShowNewDialog(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              padding: "12px 28px",
            }}
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {/* Filters */}
        {projects.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div
              style={{
                position: "relative",
                flex: "1 1 250px",
                maxWidth: 350,
              }}
            >
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="input-field"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Subject filters */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SUBJECT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSubjectFilter(f.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor:
                      subjectFilter === f.value
                        ? "var(--accent-primary)"
                        : "var(--border-primary)",
                    background:
                      subjectFilter === f.value
                        ? "rgba(108, 92, 231, 0.15)"
                        : "transparent",
                    color:
                      subjectFilter === f.value
                        ? "var(--accent-primary)"
                        : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 80,
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
        ) : filteredProjects.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="empty-state">
            <div
              style={{
                background: "rgba(108, 92, 231, 0.1)",
                borderRadius: 24,
                padding: 32,
                marginBottom: 24,
              }}
            >
              <Sparkles
                size={48}
                color="var(--accent-primary)"
                style={{ opacity: 0.7 }}
              />
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              No projects yet
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 15,
                maxWidth: 400,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Create your first project to start scanning worksheets and
              converting them to editable Word documents.
            </p>
            <button
              className="glow-button"
              onClick={() => setShowNewDialog(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
              }}
            >
              <Plus size={18} />
              Create First Project
            </button>
          </div>
        ) : (
          /* No search results */
          <div className="empty-state">
            <FileText
              size={48}
              color="var(--text-muted)"
              style={{ opacity: 0.3, marginBottom: 16 }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              No projects match your search
            </p>
          </div>
        )}
      </main>

      {showNewDialog && (
        <NewProjectDialog
          onClose={() => setShowNewDialog(false)}
          onCreated={fetchProjects}
        />
      )}
    </div>
  );
}
