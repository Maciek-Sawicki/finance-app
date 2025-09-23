import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="bg-background text-foreground dark:bg-background-dark dark:text-foreground-dark min-h-screen p-4">
  <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
  <p>Tu będą podsumowania, wykresy i raporty.</p>
  <Button>Click me</Button>
  <ModeToggle />
</div>

  );
}
