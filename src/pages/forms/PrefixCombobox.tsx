import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface ComboboxOption {
  value: string;
  label: string;
}

interface PrefixComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PrefixCombobox = ({
  options,
  value,
  onChange,
  placeholder = "Select prefix",
}: PrefixComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        className="border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none cursor-pointer flex items-center justify-between"
        style={{ borderBottomWidth: 1, borderColor: "#d1d5db" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedLabel || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex bg-transparent border-0 focus:ring-0 focus:outline-none text-sm p-0"
          autoComplete="off"
        />
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}

        </div>
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50"
          style={{ maxHeight: "200px", overflowY: "auto" }}
        >
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    value === option.value ? "#eff6ff" : "transparent",
                  color: value === option.value ? "#1e40af" : "inherit",
                  fontWeight:
                    value === option.value ? "500" : "normal",
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
