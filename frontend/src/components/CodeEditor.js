import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Eraser } from "@phosphor-icons/react";
import { useLua } from "@/hooks/useLua";
import { codeAPI } from "@/lib/api";

export default function CodeEditor({ lessonId, starterCode, expectedOutput, onOutputChange, onCodeChange, onSuccess }) {
  const [code, setCode] = useState(() => {
    if (lessonId) {
      const saved = localStorage.getItem(`luayou_code_${lessonId}`);
      if (saved) return saved;
    }
    return starterCode || "";
  });
  const { runLua, output, error, success, running } = useLua();
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  useEffect(() => {
    const saved = lessonId ? localStorage.getItem(`luayou_code_${lessonId}`) : null;
    setCode(saved || starterCode || "");
  }, [starterCode, lessonId]);

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const syncScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCodeChange = (val) => {
    setCode(val);
    onCodeChange?.(val);
    if (lessonId) {
      localStorage.setItem(`luayou_code_${lessonId}`, val);
    }
  };

  const handleRun = async () => {
    const expected = expectedOutput ?? null;
    const localResult = await runLua(code, expected);
    let finalResult = {
      ...localResult,
      validation_message: null,
      lesson_completed: false,
      xp_earned: 0,
      new_level: null,
      new_badges: [],
    };

    if (lessonId) {
      try {
        const response = await codeAPI.run({
          code,
          lesson_id: lessonId,
          output: localResult.output,
          success: localResult.success,
          error: localResult.error,
        });
        finalResult = { ...finalResult, ...response.data };
      } catch (error) {
        finalResult = {
          ...finalResult,
          success: false,
          error: error.response?.data?.detail || "Validation failed",
        };
      }
    }

    onOutputChange?.(finalResult.output, finalResult.error, finalResult);
    if (finalResult.success === true && expected !== null) {
      onSuccess?.(finalResult);
    }
  };

  const handleClear = () => {
    setCode(starterCode || "");
    onCodeChange?.(starterCode || "");
    onOutputChange?.("", "");
    if (lessonId) {
      localStorage.removeItem(`luayou_code_${lessonId}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      onCodeChange?.(newCode);
      if (lessonId) {
        localStorage.setItem(`luayou_code_${lessonId}`, newCode);
      }
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
          {success === true && <span className="font-mono text-xs text-white/50">[pass]</span>}
          {success === false && <span className="font-mono text-xs text-white/30">[fail]</span>}
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

      {/* Editor with line numbers */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="bg-background border-r border-white/5 pt-4 pb-4 overflow-hidden select-none"
          style={{ minWidth: "3rem" }}
        >
          {lineNumbers.map((n) => (
            <div
              key={n}
              className="font-mono text-xs text-white/20 text-right pr-3 leading-6"
              style={{ fontSize: "13px", lineHeight: "1.5rem" }}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 p-4 bg-background font-mono text-sm text-white/80 resize-none outline-none leading-6"
          style={{ fontSize: "13px", lineHeight: "1.5rem" }}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          placeholder="-- Write your Lua code here..."
          data-testid="code-textarea"
        />
      </div>

      {/* Output */}
      <div className="border-t border-white/10" data-testid="code-output-panel">
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
          <span className="font-mono text-xs text-white/30">output</span>
          <span className="font-mono text-xs text-white/20 ml-auto">ctrl+enter to run</span>
        </div>
        <div className="p-4 min-h-[80px] max-h-[200px] overflow-y-auto">
          {output && (
            <div className="terminal-output text-white/70" data-testid="code-output">{output}</div>
          )}
          {error && (
            <div className="terminal-output text-white/40" data-testid="code-error">{error}</div>
          )}
          {!output && !error && (
            <span className="font-mono text-xs text-white/15">Run your code to see output here</span>
          )}
        </div>
      </div>
    </div>
  );
}
