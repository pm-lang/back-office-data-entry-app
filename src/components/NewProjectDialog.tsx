"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface NewProjectDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const SUBJECTS = [
  { value: "HINDI", label: "हिन्दी (Hindi)", emoji: "🔶" },
  { value: "MATHS", label: "Mathematics", emoji: "🔢" },
  { value: "ENGLISH", label: "English", emoji: "📖" },
  { value: "SCIENCE", label: "Science", emoji: "🔬" },
  { value: "PHYSICS", label: "Physics", emoji: "⚛️" },
  { value: "CHEMISTRY", label: "Chemistry", emoji: "🧪" },
  { value: "OTHER", label: "Other", emoji: "📄" },
];

export default function NewProjectDialog({
  onClose,
  onCreated,
}: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("HINDI");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject,
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Project</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Project Name *
            </label>
            <input
              className="input-field"
              placeholder="e.g., Class VII Hindi Half Yearly 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Subject
            </label>
            <select
              className="select-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
                display: "block",
              }}
            >
              Description (optional)
            </label>
            <textarea
              className="input-field"
              placeholder="Brief description of the worksheet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          <button
            className="glow-button"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: !name.trim() || loading ? 0.5 : 1,
              fontSize: 15,
            }}
          >
            <Plus size={18} />
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
