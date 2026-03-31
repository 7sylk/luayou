import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { lessonsAPI } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Check, ArrowRight } from "@phosphor-icons/react";
import { LessonsSkeleton } from "@/components/Skeleton";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    lessonsAPI.list()
      .then((r) => setLessons(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const beginner = lessons.filter((l) => l.difficulty === "beginner");
  const intermediate = lessons.filter((l) => l.difficulty === "intermediate");
  const advanced = lessons.filter((l) => l.difficulty === "advanced");

  const LessonCard = ({ lesson }) => (
    <button
      className={`w-full text-left border border-white/10 p-5 flex items-center justify-between group transition-colors ${
        lesson.locked ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.02] hover:border-white/20"
      }`}
      onClick={() => !lesson.locked && navigate(`/lessons/${lesson.id}`)}
      disabled={lesson.locked}
      data-testid={`lesson-card-${lesson.id}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 flex items-center justify-center border ${
          lesson.completed ? "border-white bg-white text-black" : lesson.locked ? "border-white/10" : "border-white/20"
        }`}>
          {lesson.completed ? (
            <Check size={14} weight="bold" />
          ) : lesson.locked ? (
            <Lock size={14} weight="regular" />
          ) : (
            <span className="font-mono text-xs">{lesson.order_index}</span>
          )}
        </div>
        <div>
          <h3 className="font-mono font-bold text-sm">{lesson.title}</h3>
          <p className="text-xs text-white/40 mt-0.5">+{lesson.xp_reward} XP</p>
        </div>
      </div>
      {!lesson.locked && !lesson.completed && (
        <ArrowRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
      )}
    </button>
  );

  const LessonList = ({ items }) => (
    <div className="grid grid-cols-1 gap-2">
      {items.map((l) => <LessonCard key={l.id} lesson={l} />)}
    </div>
  );

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
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-8 animate-fade-in">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Curriculum</p>
          <h1 className="font-mono font-black text-3xl sm:text-4xl tracking-tighter">Lessons</h1>
          <p className="text-sm text-white/40 mt-2 font-light">
            {lessons.filter((l) => l.completed).length} / {lessons.length} completed
          </p>
        </div>

        <Tabs defaultValue="beginner" className="animate-fade-in stagger-1">
          <TabsList className="bg-transparent border border-white/10 rounded-none h-auto p-0 w-full grid grid-cols-3">
            <TabsTrigger value="beginner" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black" data-testid="tab-beginner">
              Beginner ({beginner.length})
            </TabsTrigger>
            <TabsTrigger value="intermediate" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black" data-testid="tab-intermediate">
              Intermediate ({intermediate.length})
            </TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-none font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black" data-testid="tab-advanced">
              Advanced ({advanced.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="beginner" className="mt-6">
            <LessonList items={beginner} />
          </TabsContent>
          <TabsContent value="intermediate" className="mt-6">
            <LessonList items={intermediate} />
          </TabsContent>
          <TabsContent value="advanced" className="mt-6">
            <LessonList items={advanced} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}