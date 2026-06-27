"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <Navbar />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 15,
            marginBottom: 32,
          }}
        >
          Configure your API keys and preferences
        </p>

        {/* Gemini API Key Section */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "rgba(108, 92, 231, 0.15)",
                borderRadius: 10,
                padding: 8,
                display: "flex",
              }}
            >
              <Key size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>
                Google Gemini API Key
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Required for AI-powered OCR processing
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <input
              className="input-field"
              type="password"
              placeholder="Enter your Gemini API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="glow-button"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                style={{
                  fontSize: 13,
                  padding: "8px 20px",
                  opacity: !apiKey.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {saved ? <CheckCircle2 size={14} /> : null}
                {saved ? "Saved!" : "Save Key"}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: testResult.success
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${
                  testResult.success
                    ? "rgba(16, 185, 129, 0.3)"
                    : "rgba(239, 68, 68, 0.3)"
                }`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: testResult.success ? "#34d399" : "#f87171",
              }}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "rgba(59, 130, 246, 0.15)",
                borderRadius: 10,
                padding: 8,
                display: "flex",
              }}
            >
              <Info size={20} color="var(--info)" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>
              How to Get Your Gemini API Key
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  background: "var(--accent-gradient)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                1
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  Go to Google AI Studio
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-primary)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  https://aistudio.google.com/apikey
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  background: "var(--accent-gradient)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                2
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  Sign in with your Google account
                </p>
                <p style={{ fontSize: 13, marginTop: 2 }}>
                  Use any Google account. The free tier is sufficient for most
                  use.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  background: "var(--accent-gradient)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                3
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  Click &quot;Create API Key&quot;
                </p>
                <p style={{ fontSize: 13, marginTop: 2 }}>
                  Select &quot;Create API key in new project&quot; or choose an existing
                  Google Cloud project.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  background: "var(--accent-gradient)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                4
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  Copy the API key and paste it above
                </p>
                <p style={{ fontSize: 13, marginTop: 2 }}>
                  Your key will look like:{" "}
                  <code
                    style={{
                      background: "var(--bg-card)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    AIzaSy...
                  </code>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  background: "var(--accent-gradient)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                5
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  Also set it in your <code style={{
                      background: "var(--bg-card)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}>.env.local</code> file
                </p>
                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginTop: 8,
                    fontFamily: "monospace",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>GEMINI_API_KEY=your_key_here</span>
                  <button
                    onClick={() => handleCopy("GEMINI_API_KEY=")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 10,
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              fontSize: 13,
              color: "#fbbf24",
              lineHeight: 1.5,
            }}
          >
            <strong>💡 Tip:</strong> The Gemini API free tier provides generous
            usage limits. For most worksheet scanning projects, you won&apos;t need
            to pay anything. The key must be set in the <code style={{
              background: "rgba(245, 158, 11, 0.15)",
              padding: "1px 5px",
              borderRadius: 3,
            }}>.env.local</code> file for the server-side OCR to work.
          </div>
        </div>
      </main>
    </div>
  );
}
