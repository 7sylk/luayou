import { useState, useEffect } from "react";
import { quizAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Quiz({ lessonId }) {
  const { refreshUser } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setResults(null);
    setAnswers([]);
    quizAPI
      .get(lessonId)
      .then((r) => {
        setQuiz(r.data);
        setAnswers(new Array(r.data.questions.length).fill(-1));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const handleSelect = (qIdx, optIdx) => {
    if (results) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      toast.error("Answer all questions first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await quizAPI.submit({
        quiz_id: quiz.id,
        lesson_id: lessonId,
        answers,
      });
      setResults(res.data);
      if (res.data.xp_earned > 0) {
        toast.success(`+${res.data.xp_earned} XP from quiz!`);
      }
      await refreshUser();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error submitting quiz");
    }
    setSubmitting(false);
  };

  const handleRetry = () => {
    setResults(null);
    setAnswers(new Array(quiz.questions.length).fill(-1));
  };

  if (loading) {
    return <div className="font-mono text-sm text-white/30">loading<span className="cursor-blink">_</span></div>;
  }

  if (!quiz) {
    return <div className="font-mono text-sm text-white/30">No quiz available for this lesson.</div>;
  }

  return (
    <div data-testid="quiz-section">
      <h2 className="font-mono font-bold text-lg tracking-tight mb-4">Quiz</h2>
      {results && (
        <div className="border border-white/10 p-4 mb-6" data-testid="quiz-results">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-bold text-sm">
              Score: {results.score}/{results.total}
            </span>
            <span className="font-mono text-xs text-white/40">+{results.xp_earned} XP</span>
          </div>
          <div className="h-1.5 bg-white/5 mb-3">
            <div className="h-full bg-white" style={{ width: `${(results.score / results.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, qIdx) => {
          const result = results?.results?.[qIdx];
          return (
            <div key={qIdx} className="border border-white/10 p-4" data-testid={`quiz-question-${qIdx}`}>
              <p className="font-mono text-sm font-bold mb-3">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oIdx) => {
                  let style = "border-white/10 hover:bg-white/[0.02]";
                  if (answers[qIdx] === oIdx && !results) {
                    style = "border-white/40 bg-white/5";
                  }
                  if (result) {
                    if (oIdx === result.correct_answer) {
                      style = "border-white/40 bg-white/10";
                    } else if (oIdx === result.your_answer && !result.is_correct) {
                      style = "border-white/10 bg-white/[0.02] opacity-50";
                    } else {
                      style = "border-white/5 opacity-30";
                    }
                  }
                  return (
                    <button
                      key={oIdx}
                      className={`w-full text-left border p-3 font-mono text-sm transition-colors ${style}`}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      disabled={!!results}
                      data-testid={`quiz-option-${qIdx}-${oIdx}`}
                    >
                      <span className="text-white/30 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {result && (
                <p className="mt-3 text-xs text-white/40 font-light">
                  {result.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        {!results ? (
          <Button
            className="bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider rounded-none"
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="quiz-submit-btn"
          >
            {submitting ? "..." : "Submit answers"}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider rounded-none"
            onClick={handleRetry}
            data-testid="quiz-retry-btn"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
