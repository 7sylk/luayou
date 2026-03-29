import { useState } from "react";
import { aiAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Brain } from "@phosphor-icons/react";

const MODES = [
  { value: "hint", label: "Hint" },
  { value: "explanation", label: "Explain" },
  { value: "solution", label: "Solution" },
];

export default function AiTutor({ code, errorOutput, lessonId }) {
  const [mode, setMode] = useState("hint");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!code?.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await aiAPI.tutor({
        code,
        error_output: errorOutput || "",
        mode,
        lesson_id: lessonId,
      });
      setResponse(res.data.response);
    } catch (e) {
      setResponse("Error connecting to AI tutor. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div data-testid="ai-tutor-section">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} weight="bold" className="text-white/60" />
        <h2 className="font-mono font-bold text-lg tracking-tight">AI Tutor</h2>
      </div>

      <p className="text-xs text-white/40 font-light mb-4">
        Send your code and any errors to get AI-powered help. Choose a mode below.
      </p>

      {/* Mode Selection */}
      <div className="flex gap-1 mb-4" data-testid="ai-mode-selector">
        {MODES.map((m) => (
          <button
            key={m.value}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${
              mode === m.value
                ? "border-white bg-white text-black"
                : "border-white/10 text-white/50 hover:bg-white/5"
            }`}
            onClick={() => setMode(m.value)}
            data-testid={`ai-mode-${m.value}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Button
        className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none mb-4"
        onClick={handleAsk}
        disabled={loading || !code?.trim()}
        data-testid="ai-ask-btn"
      >
        {loading ? (
          <span>thinking<span className="cursor-blink">_</span></span>
        ) : (
          `Ask for ${mode}`
        )}
      </Button>

      {/* Response */}
      {response && (
        <div className="border border-white/10 p-4" data-testid="ai-response">
          <div className="font-mono text-xs text-white/30 mb-2">&gt; AI Tutor ({mode})</div>
          <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}

      {!response && !loading && (
        <div className="border border-white/5 p-4">
          <p className="font-mono text-xs text-white/15">
            Write some code in the editor, then ask the AI tutor for help.
          </p>
        </div>
      )}
    </div>
  );
}
