import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadingForm from "@/components/ReadingForm";
import Dashboard from "@/components/Dashboard";
import BadgeWall from "@/components/BadgeWall";
import { BookOpen, BarChart3, Award } from "lucide-react";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-2 border-border bg-card">
        <div className="container max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-2xl shadow-md">
              📚
            </div>
            <div>
              <h1 className="text-xl font-display font-extrabold text-foreground tracking-tight">My Reading Log</h1>
              <p className="text-sm text-muted-foreground font-medium">Track your reading adventures!</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary h-12">
            <TabsTrigger value="log" className="font-display font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-1.5" /> Log
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="font-display font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Stats
            </TabsTrigger>
            <TabsTrigger value="badges" className="font-display font-bold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4 mr-1.5" /> Badges
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
