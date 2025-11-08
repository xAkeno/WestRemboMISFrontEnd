import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormField {
  label: string;
  id: string;
  type?: "text" | "select" | "textarea" | "date";
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export const FormSection = ({ fields }: { fields: FormField[] }) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
          </Label>
          {field.type === "select" ? (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={field.id} className="bg-background border-border">
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "textarea" ? (
            <Textarea
              id={field.id}
              value={field.value}
              onChange={(e) => field.onChange?.(e.target.value)}
              className="bg-background border-border min-h-[80px]"
            />
          ) : (
            <Input
              id={field.id}
              type={field.type || "text"}
              value={field.value}
              onChange={(e) => field.onChange?.(e.target.value)}
              className="bg-background border-border"
            />
          )}
        </div>
      ))}
    </div>
  );
};
