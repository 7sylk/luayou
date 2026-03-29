import { useState, useEffect } from "react";
import { codeAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Play, Eraser } from "@phosphor-icons/react";

export default function CodeEditor({ lessonId, starterCode, onOutputChange, onCodeChange }) {
  const [code, setCode] = useState(starterCode || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setCode(starterCode || "");
    setOutput("");
    setError("");
    setSuccess(null);
  }, [starterCode, lessonId]);

  const handleCodeChange = (val) => {
    setCode(val);
    onCodeChange?.(val);
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    setError("");
    setSuccess(null);
    try {
      const res = await codeAPI.run({ code, lesson_id: lessonId });
      setOutput(res.data.output || "");
      setError(res.data.error || "");
      setSuccess(res.data.success);
      onOutputChange?.(res.data.output || "", res.data.error || "");
    } catch (e) {
      const msg = e.response?.data?.detail || "Execution error";
      setError(msg);
      onOutputChange?.("", msg);
    }
    setRunning(false);
  };

  const handleClear = () => {
    setCode(starterCode || "");
    setOutput("");
    setError("");
    setSuccess(null);
    onCodeChange?.(starterCode || "");
    onOutputChange?.("", "");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      onCodeChange?.(newCode);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="code-editor">
      {/* Toolbar */}
      <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/30">editor.lua</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none font-mono text-xs text-white/30 hover:text-white h-7 px-2"
            onClick={handleClear}
            data-testid="code-clear-btn"
          >
            <Eraser size={14} className="mr-1" /> Clear
          </Button>
          <Button
            size="sm"
            className="bg-white text-black hover:bg-neutral-200 rounded-none font-mono text-xs uppercase tracking-wider h-7 px-4"
            onClick={handleRun}
            disabled={running}
            data-testid="code-run-btn"
          >
            <Play size={12} weight="fill" className="mr-1" />
            {running ? "..." : "Run"}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <textarea
          className="code-editor-textarea w-full h-full p-4 bg-background"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="-- Write your Lua code here..."
          data-testid="code-textarea"
        />
      </div>

      {/* Output */}
      <div className="border-t border-white/10" data-testid="code-output-panel">
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
          <span className="font-mono text-xs text-white/30">output</span>
          {success !== null && (
            <span className={`font-mono text-xs ${success ? "text-white/60" : "text-white/40"}`}>
              {success ? "[pass]" : "[fail]"}
            </span>
          )}
          <span className="font-mono text-xs text-white/20 ml-auto">ctrl+enter to run</span>
        </div>
        <div className="p-4 min-h-[80px] max-h-[200px] overflow-y-auto">
          {output && (
            <div className="terminal-output text-white/70" data-testid="code-output">
              {output}
            </div>
          )}
          {error && (
            <div className="terminal-output text-white/40" data-testid="code-error">
              {error}
            </div>
          )}
          {!output && !error && (
            <span className="font-mono text-xs text-white/15">Run your code to see output here</span>
          )}
        </div>
      </div>
    </div>
  );
}
