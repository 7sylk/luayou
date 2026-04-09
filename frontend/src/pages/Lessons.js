import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import LearningPath from "@/components/LearningPath";
import { LessonsSkeleton } from "@/components/Skeleton";
import { formatApiError, lessonsAPI } from "@/lib/api";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    lessonsAPI
      .list()
      .then((r) => {
        setLessons(r.data);
        setError("");
      })
      .catch((err) => {
        setLessons([]);
        setError(formatApiError(err?.response?.data?.detail));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!lessons.length) return;
    const fallback = lessons.find((lesson) => !lesson.locked) || lessons[0];
    setSelectedLessonId((current) => current || fallback?.id || null);
  }, [lessons]);

  const stats = useMemo(() => {
    const completed = lessons.filter((lesson) => lesson.completed).length;
    const ready = lessons.filter((lesson) => !lesson.locked && !lesson.completed).length;
    return { completed, ready, total: lessons.length };
  }, [lessons]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LessonsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="lessons-page">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6">
        <div className="mb-8 animate-fade-in">
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-mono text-3xl font-black tracking-tight sm:text-4xl">Lessons</h1>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Completed</p>
                <p className="mt-2 font-mono text-2xl font-black">{stats.completed}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Ready now</p>
                <p className="mt-2 font-mono text-2xl font-black">{stats.ready}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Total</p>
                <p className="mt-2 font-mono text-2xl font-black">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border border-white/10 bg-white/[0.02] px-5 py-8 text-center">
            <p className="font-mono text-sm text-white/70">Lessons could not be loaded.</p>
            <p className="mt-2 text-sm text-white/35">{error}</p>
          </div>
        ) : lessons.length ? (
          <LearningPath
            lessons={lessons}
            selectedLessonId={selectedLessonId}
            onSelectLesson={(lesson) => setSelectedLessonId(lesson.id)}
            onStartLesson={(lesson) => navigate(`/lessons/${lesson.id}`)}
            onStartMastery={(lesson) => navigate(`/lessons/${lesson.id}?mode=mastery`)}
          />
        ) : (
          <div className="border border-white/10 bg-white/[0.02] px-5 py-8 text-center">
            <p className="font-mono text-sm text-white/70">No lessons are available yet.</p>
            <p className="mt-2 text-sm text-white/35">Once the curriculum loads, your path will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
