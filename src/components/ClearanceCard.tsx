import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface ClearanceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  gradient?: "primary" | "accent";
}

export function ClearanceCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  gradient = "primary"
}: ClearanceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-6 cursor-pointer transition-all duration-300 hover:scale-105",
        "border-2 hover:shadow-lg group relative overflow-hidden"
      )}
      style={{ 
        boxShadow: "var(--shadow-card)",
        transition: "var(--transition-smooth)"
      }}
    >
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
          gradient === "primary" ? "bg-primary" : "bg-accent"
        )}
      />
      <div className="relative z-10">
        <div 
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
            gradient === "primary" ? "bg-primary/10" : "bg-accent/10"
          )}
        >
          <Icon 
            className={cn(
              "w-7 h-7",
              gradient === "primary" ? "text-primary" : "text-accent"
            )} 
          />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
