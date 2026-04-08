import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CaretLeft, CaretRight, Check, Lock, Sparkle } from "@phosphor-icons/react";

const UNIT_META = [
  { title: "Unit 1", label: "Foundations" },
  { title: "Unit 2", label: "Control Flow" },
  { title: "Unit 3", label: "Functions" },
  { title: "Unit 4", label: "Tables" },
  { title: "Unit 5", label: "Strings" },
  { title: "Unit 6", label: "Practice" },
  { title: "Unit 7", label: "Modules" },
  { title: "Unit 8", label: "Debugging" },
  { title: "Unit 9", label: "Metatables" },
  { title: "Unit 10", label: "Advanced" },
];

const PATH_PATTERN = [0, 18, 6, 24, 10, 28, 8, 20, 4, 22];

function chunkLessons(lessons) {
  return Array.from({ length: Math.ceil(lessons.length / 10) }, (_, index) => {
    const items = lessons.slice(index * 10, index * 10 + 10);
    const completed = items.filter((lesson) => lesson.completed).length;
    const previousUnitsComplete = index === 0 || lessons.slice(0, index * 10).every((lesson) => lesson.completed);
    return {
      id: `unit-${index + 1}`,
      title: UNIT_META[index]?.title || `Unit ${index + 1}`,
      label: UNIT_META[index]?.label || `Stage ${index + 1}`,
      lessons: items,
      completed,
      unlocked: previousUnitsComplete,
      complete: completed === items.length && items.length > 0,
    };
  });
}

export default function LearningPath({ lessons, onStartLesson, onStartMastery }) {
  const units = useMemo(() => chunkLessons(lessons), [lessons]);
  const initialUnitIndex = Math.max(0, units.findIndex((unit) => unit.unlocked && !unit.complete));
  const [unitIndex, setUnitIndex] = useState(initialUnitIndex === -1 ? 0 : initialUnitIndex);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const currentUnit = units[unitIndex] || units[0];
  const visibleLessons = currentUnit?.lessons || [];
  const selectedLesson =
    visibleLessons.find((lesson) => lesson.id === selectedLessonId) ||
    visibleLessons.find((lesson) => !lesson.locked) ||
    visibleLessons[0];

  const completedCount = lessons.filter((lesson) => lesson.completed).length;
  const nextUnit = units[unitIndex + 1];
  const canAdvanceUnit = Boolean(currentUnit?.complete && nextUnit?.unlocked);

  const handleAdvanceUnit = () => {
    if (canAdvanceUnit) {
      setUnitIndex((current) => current + 1);
      setSelectedLessonId(null);
    }
  };

  if (!currentUnit) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between border border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setUnitIndex((current) => Math.max(0, current - 1))}
            disabled={unitIndex === 0}
            className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] ${
              unitIndex === 0 ? "text-white/20" : "text-white/50 hover:text-white"
            }`}
          >
            <CaretLeft size={14} />
            Prev
          </button>

          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/30">{currentUnit.title}</p>
            <h2 className="font-mono text-xl font-black tracking-tight">{currentUnit.label}</h2>
          </div>

          <button
            type="button"
            onClick={() => setUnitIndex((current) => Math.min(units.length - 1, current + 1))}
            disabled={!nextUnit?.unlocked}
            className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] ${
              !nextUnit?.unlocked ? "text-white/20" : "text-white/50 hover:text-white"
            }`}
          >
            Next
            <CaretRight size={14} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {units.map((unit, index) => (
            <button
              key={unit.id}
              type="button"
              disabled={!unit.unlocked}
              onClick={() => {
                if (unit.unlocked) {
                  setUnitIndex(index);
                  setSelectedLessonId(null);
                }
              }}
              className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                index === unitIndex
                  ? "border-white/30 text-white"
                  : unit.unlocked
                  ? "border-white/10 text-white/45 hover:text-white hover:border-white/20"
                  : "border-white/10 text-white/20"
              }`}
            >
              {unit.title}
            </button>
          ))}
        </div>

        <div className="border border-white/10 p-4 sm:p-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/30">Path</p>
              <p className="mt-1 font-mono text-sm text-white/55">
                {completedCount} / {lessons.length} complete
              </p>
            </div>
            <p className="font-mono text-sm text-white/45">
              {currentUnit.completed} / {currentUnit.lessons.length}
            </p>
          </div>

          <div className="relative min-h-[680px]">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
            <div className="space-y-6">
              {visibleLessons.map((lesson, idx) => {
                const isSelected = selectedLesson?.id === lesson.id;
                const bubbleClasses = lesson.mastered
                  ? "border-[#8b6b24] bg-[#c7a34b] text-black"
                  : lesson.completed
                  ? "border-white bg-white text-black"
                  : lesson.locked
                  ? "border-white/10 bg-transparent text-white/20"
                  : isSelected
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/20 bg-background text-white/65 hover:border-white/35 hover:text-white";

                return (
                  <div
                    key={lesson.id}
                    className="relative flex"
                    style={{ marginLeft: `${PATH_PATTERN[idx % PATH_PATTERN.length]}%` }}
                  >
                    <button
                      type="button"
                      disabled={lesson.locked}
                      onClick={() => !lesson.locked && setSelectedLessonId(lesson.id)}
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-24 sm:w-24 ${bubbleClasses} ${
                        lesson.locked ? "cursor-not-allowed" : "hover:-translate-y-1"
                      }`}
                      data-testid={`path-bubble-${lesson.id}`}
                    >
                      {lesson.mastered ? (
                        <Sparkle size={26} weight="fill" />
                      ) : lesson.completed ? (
                        <Check size={28} weight="bold" />
                      ) : lesson.locked ? (
                        <Lock size={24} />
                      ) : (
                        <BookOpen size={26} weight="fill" />
                      )}
                      <span className="absolute -bottom-3 rounded-full border border-white/10 bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {lesson.order_index}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleAdvanceUnit}
              disabled={!canAdvanceUnit}
              className={`inline-flex items-center gap-2 border px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                canAdvanceUnit
                  ? "border-white/20 text-white/70 hover:border-white/35 hover:text-white"
                  : "border-white/10 text-white/20"
              }`}
            >
              Next unit
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-white/10 bg-background p-5">
          {selectedLesson ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/30">{currentUnit.title}</p>
              <h3 className="mt-2 font-mono text-xl font-black tracking-tight">{selectedLesson.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
                  {selectedLesson.difficulty}
                </span>
                <span className="border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
                  +{selectedLesson.xp_reward} XP
                </span>
                {selectedLesson.mastered && (
                  <span className="border border-[#8b6b24]/50 bg-[#c7a34b]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#d9bb70]">
                    Mastered
                  </span>
                )}
              </div>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={selectedLesson.locked}
                  onClick={() => !selectedLesson.locked && onStartLesson(selectedLesson)}
                  className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                    selectedLesson.locked
                      ? "cursor-not-allowed border-white/10 text-white/20"
                      : "border-white/20 text-white/70 hover:border-white/35 hover:text-white"
                  }`}
                  data-testid={`start-lesson-${selectedLesson.id}`}
                >
                  {selectedLesson.completed ? "Review lesson" : "Start lesson"}
                </button>
                {selectedLesson.completed && (
                  <button
                    type="button"
                    onClick={() => onStartMastery?.(selectedLesson)}
                    className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                      selectedLesson.mastered
                        ? "border-[#8b6b24]/50 text-[#d9bb70] hover:border-[#c7a34b] hover:text-[#f0d78b]"
                        : "border-[#8b6b24]/40 text-[#c7a34b] hover:border-[#c7a34b] hover:text-[#f0d78b]"
                    }`}
                  >
                    {selectedLesson.mastered ? "Review mastery" : "Start mastery"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="font-mono text-sm text-white/35">Select a lesson bubble.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
