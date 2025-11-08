export function Header() {
  return (
    <header className="bg-card border-b border-border p-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">West Rembo</h1>
        <p className="text-sm text-muted-foreground">Barangay Clearance System</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">WR</span>
        </div>
      </div>
    </header>
  );
}
