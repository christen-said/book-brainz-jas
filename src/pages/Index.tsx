import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadingForm from "@/components/ReadingForm";
import Dashboard from "@/components/Dashboard";
import BadgeWall from "@/components/BadgeWall";
import History from "@/components/History";
import StreakBadge from "@/components/StreakBadge";
import LevelUpModal from "@/components/LevelUpModal";
import { BookOpen, BarChart3, Award, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useReadingEntries, getTotalPagesRead } from "@/lib/readingLog";
import { getLevel, type ReaderLevel } from "@/lib/level";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { signOut } = useAuth();
  const { entries } = useReadingEntries(refreshKey);
  const [levelUp, setLevelUp] = useState<ReaderLevel | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    const totalPages = getTotalPagesRead(entries);
    const current = getLevel(totalPages);
    if (prevLevelRef.current !== null && current.level > prevLevelRef.current) {
      setLevelUp(current);
    }
    prevLevelRef.current = current.level;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-primary bg-card">
        <div className="container max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-3xl shadow-md rotate-[-6deg] hover:rotate-[6deg] transition-transform duration-300">
                😑
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight truncate">
                  Book Brainz
                </h1>
                <p className="text-sm text-muted-foreground font-medium truncate">
                  ugh, fine. let's do this. 📖
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StreakBadge refreshKey={refreshKey} />
              <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl" title="Sign out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-secondary h-14 rounded-2xl p-1">
            <TabsTrigger value="log" className="font-display font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <BookOpen className="w-4 h-4 mr-1" /> Log It
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="font-display font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <BarChart3 className="w-4 h-4 mr-1" /> Stats
            </TabsTrigger>
            <TabsTrigger value="badges" className="font-display font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <Award className="w-4 h-4 mr-1" /> Swag
            </TabsTrigger>
            <TabsTrigger value="history" className="font-display font-bold text-xs rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              <span className="mr-1">📜</span> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <ReadingForm onSave={() => setRefreshKey((k) => k + 1)} />
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="badges">
            <BadgeWall refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="history">
            <History refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
