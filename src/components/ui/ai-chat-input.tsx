"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  value?: string;
}

const PromptInput = React.forwardRef<HTMLInputElement, PromptInputProps>(
  ({ placeholder = "Type your message...", onSubmit, onChange, disabled = false, className, value: controlledValue }, ref) => {
    const [internalValue, setInternalValue] = React.useState("");
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && onSubmit) {
        onSubmit(value.trim());
        if (!isControlled) {
          setInternalValue("");
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      if (onChange) {
        onChange(newValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && onSubmit) {
          onSubmit(value.trim());
          if (!isControlled) {
            setInternalValue("");
          }
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className={cn("flex w-full items-center gap-2", className)}>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowUp size={16} />
          <span className="sr-only">Send message</span>
        </button>
      </form>
    );
  }
);
PromptInput.displayName = "PromptInput";

export { PromptInput };
