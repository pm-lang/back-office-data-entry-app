"use client";

export function SubjectBadge({ subject }: { subject: string }) {
  const badgeClass =
    subject === "HINDI"
      ? "badge badge-hindi"
      : subject === "MATHS"
      ? "badge badge-maths"
      : subject === "ENGLISH"
      ? "badge badge-english"
      : subject === "SCIENCE" || subject === "PHYSICS" || subject === "CHEMISTRY"
      ? "badge badge-science"
      : "badge badge-other";

  const label =
    subject === "HINDI"
      ? "हिन्दी"
      : subject === "MATHS"
      ? "Maths"
      : subject.charAt(0) + subject.slice(1).toLowerCase();

  return <span className={badgeClass}>{label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const statusClass =
    status === "DRAFT"
      ? "badge status-draft"
      : status === "PROCESSING"
      ? "badge status-processing"
      : status === "COMPLETED"
      ? "badge status-completed"
      : "badge status-error";

  const label =
    status === "DRAFT"
      ? "Draft"
      : status === "PROCESSING"
      ? "Processing..."
      : status === "COMPLETED"
      ? "Completed"
      : "Error";

  return <span className={statusClass}>{label}</span>;
}
