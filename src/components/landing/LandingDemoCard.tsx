import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function LandingDemoCard() {
  return (
    <Card className="mt-8 border-white/20 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_40px_-20px_rgba(88,101,242,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_40px_-20px_rgba(88,101,242,0.4)]">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Session
          </p>
          <CardTitle className="text-xl tracking-tight">
            The Midnight Library &mdash; Live
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Discord-style session summary
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <Badge className="mt-1 bg-[#5865F2] text-white hover:bg-[#5865F2]/90">
              Active
            </Badge>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Elapsed
            </p>
            <p className="mt-1 text-lg font-semibold">00:12:34</p>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Readers
            </p>
            <p className="mt-1 text-lg font-semibold">6</p>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Hosted by
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Session host</p>
            <p className="text-sm font-semibold text-foreground">@nightreader</p>
          </div>
        </div>

        <Separator className="bg-white/30 dark:bg-white/10" />

        <div className="rounded-lg border border-white/25 bg-white/30 p-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Next
          </p>
          <p className="mt-1 text-sm">Mila, Theo, Rina...</p>
        </div>
      </CardContent>
    </Card>
  );
}
