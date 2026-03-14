/**
 * SearchableSelect - A beautiful dropdown with search
 * Built with @headlessui/react Combobox
 */
import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value) || null;

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          const searchStr =
            `${option.label} ${option.description || ""}`.toLowerCase();
          return searchStr.includes(query.toLowerCase());
        });

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-300 mb-1">
          {label}
        </label>
      )}
      <Combobox
        value={value}
        onChange={(val) => onChange(val || "")}
        disabled={disabled}
      >
        <div className="relative">
          <div className="relative">
            <ComboboxInput
              className="w-full px-4 py-2 pr-10 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 text-sm"
              displayValue={() => selected?.label || ""}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown className="h-4 w-4 text-surface-500" />
            </ComboboxButton>
          </div>

          <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-surface-800 border border-surface-700 py-1 shadow-xl focus:outline-none">
            {filteredOptions.length === 0 && query !== "" ? (
              <div className="px-4 py-3 text-sm text-surface-500">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option.value}
                  value={option.value}
                  className={({ focus }) =>
                    clsx(
                      "relative cursor-pointer select-none px-4 py-2.5 text-sm",
                      focus
                        ? "bg-primary-600/20 text-primary-300"
                        : "text-surface-200",
                    )
                  }
                >
                  {({ selected: isSelected }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className={clsx(
                            "block truncate",
                            isSelected && "font-medium text-primary-400",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="block text-xs text-surface-500 mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-400 flex-shrink-0" />
                      )}
                    </div>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
