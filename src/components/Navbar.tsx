"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <div
            style={{
              background: "var(--accent-gradient)",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
            Worksheet<span style={{ color: "var(--accent-primary)" }}>AI</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              color:
                pathname === "/"
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)",
              background:
                pathname === "/"
                  ? "rgba(108, 92, 231, 0.1)"
                  : "transparent",
              transition: "all 0.2s",
            }}
          >
            <FileText size={16} />
            Projects
          </Link>
          <Link
            href="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              color:
                pathname === "/settings"
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)",
              background:
                pathname === "/settings"
                  ? "rgba(108, 92, 231, 0.1)"
                  : "transparent",
              transition: "all 0.2s",
            }}
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
