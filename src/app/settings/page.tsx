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
  Cpu,
  Cloud,
  Zap,
  Image,
} from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [ocrSpaceApiKey, setOcrSpaceApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [ocrEngine, setOcrEngine] = useState<"direct" | "tesseract" | "gemini" | "ocrspace" | "groq">("groq");
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
    const storedOcrSpaceKey = localStorage.getItem("ocr_space_api_key");
    if (storedOcrSpaceKey) setOcrSpaceApiKey(storedOcrSpaceKey);
    const storedEngine = localStorage.getItem("ocr_engine") as "direct" | "tesseract" | "gemini" | "ocrspace" | "groq";
    if (storedEngine) setOcrEngine(storedEngine);
  }, []);

  const handleEngineChange = (engine: "direct" | "tesseract" | "gemini" | "ocrspace" | "groq") => {
    setOcrEngine(engine);
    localStorage.setItem("ocr_engine", engine);
  };

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("ocr_space_api_key", ocrSpaceApiKey);
    localStorage.setItem("groq_api_key", groqApiKey);
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

        {/* OCR Engine Selection */}
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
                background: "rgba(16, 185, 129, 0.15)",
                borderRadius: 10,
                padding: 8,
                display: "flex",
              }}
            >
              <Cpu size={20} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Document Mode</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Choose how worksheet images are converted to Word documents
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              onClick={() => handleEngineChange("direct")}
              style={{
                flex: 1,
                minWidth: 140,
                padding: "16px",
                borderRadius: 12,
                border: ocrEngine === "direct" ? "2px solid #10b981" : "1px solid var(--border-primary)",
                background: ocrEngine === "direct" ? "rgba(16, 185, 129, 0.05)" : "var(--bg-card)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Image size={24} color={ocrEngine === "direct" ? "#10b981" : "var(--text-muted)"} />
              <div style={{ fontWeight: 600, color: ocrEngine === "direct" ? "#10b981" : "var(--text-primary)" }}>
                Direct (Images Only)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                ⚡ Instant. No API key. Just images → Word doc.
              </div>
            </button>
            <button
              onClick={() => handleEngineChange("tesseract")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 12,
                border: ocrEngine === "tesseract" ? "2px solid #10b981" : "1px solid var(--border-primary)",
                background: ocrEngine === "tesseract" ? "rgba(16, 185, 129, 0.05)" : "var(--bg-card)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Cpu size={24} color={ocrEngine === "tesseract" ? "#10b981" : "var(--text-muted)"} />
              <div style={{ fontWeight: 600, color: ocrEngine === "tesseract" ? "#10b981" : "var(--text-primary)" }}>
                Tesseract (Local)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                Free, runs on device. Best for printed text.
              </div>
            </button>

            <button
              onClick={() => handleEngineChange("ocrspace")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 12,
                border: `2px solid ${
                  ocrEngine === "ocrspace"
                    ? "var(--accent-primary)"
                    : "var(--border-primary)"
                }`,
                background:
                  ocrEngine === "ocrspace" ? "rgba(108, 92, 231, 0.05)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Zap
                size={24}
                color={
                  ocrEngine === "ocrspace"
                    ? "var(--accent-primary)"
                    : "var(--text-muted)"
                }
              />
              <div
                style={{
                  fontWeight: 600,
                  color:
                    ocrEngine === "ocrspace"
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                }}
              >
                OCR.Space (Fast Cloud)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                Ultra fast. Requires free API key.
              </div>
            </button>

            <button
              onClick={() => handleEngineChange("gemini")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 12,
                border: `2px solid ${
                  ocrEngine === "gemini"
                    ? "var(--accent-primary)"
                    : "var(--border-primary)"
                }`,
                background:
                  ocrEngine === "gemini" ? "rgba(108, 92, 231, 0.05)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Cloud
                size={24}
                color={
                  ocrEngine === "gemini"
                    ? "var(--accent-primary)"
                    : "var(--text-muted)"
                }
              />
              <div
                style={{
                  fontWeight: 600,
                  color:
                    ocrEngine === "gemini"
                      ? "var(--accent-primary)"
                      : "var(--text-primary)",
                }}
              >
                Gemini AI (Cloud)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                Higher accuracy. Requires API key. Best for handwriting.
              </div>
            </button>
          </div>

          {ocrEngine === "direct" && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontSize: 13,
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              Images will be placed directly into the Word document. No OCR, no API key needed. Fastest option.
            </div>
          )}

          {ocrEngine === "tesseract" && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontSize: 13,
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              Using local OCR. No API key required. Slower than Direct.
            </div>
          )}
        </div>

        {/* Groq API Key Section */}
        {ocrEngine === "groq" && (
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
                <h2 style={{ fontSize: 17, fontWeight: 600 }}>Groq API Key</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  Required for Groq Llama 4 Vision OCR
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="gsk_..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent-primary)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-primary)")
                }
              />
              <button
                onClick={handleSave}
                style={{
                  background: "var(--accent-primary)",
                  color: "white",
                  border: "none",
                  padding: "0 24px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "opacity 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {saved ? <Check size={18} /> : "Save Key"}
              </button>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: "rgba(108, 92, 231, 0.05)",
                display: "flex",
                gap: 8,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                Get your free API key at{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  console.groq.com
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Gemini API Key Section - Only show if Gemini is selected */}
        {ocrEngine === "gemini" && (
          <>
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
        </>
        )}

        {/* OCR.Space API Key Section */}
        {ocrEngine === "ocrspace" && (
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
                  OCR.Space API Key
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  Get a free key at <a href="https://ocr.space/ocrapi" target="_blank" rel="noreferrer" style={{color: "var(--accent-primary)"}}>ocr.space/ocrapi</a>
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your OCR.Space free API key..."
                value={ocrSpaceApiKey}
                onChange={(e) => setOcrSpaceApiKey(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="glow-button"
                  onClick={handleSave}
                  disabled={!ocrSpaceApiKey.trim()}
                  style={{
                    fontSize: 13,
                    padding: "8px 20px",
                    opacity: !ocrSpaceApiKey.trim() ? 0.5 : 1,
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
          </div>
        )}

        {/* Setup Instructions */}
        {ocrEngine === "gemini" && (
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
        )}

      </main>
    </div>
  );
}

