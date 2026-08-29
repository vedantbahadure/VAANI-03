import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Languages } from "lucide-react";
import { useLang } from "../lib/contexts";
import { LANGS } from "../lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="grid place-items-center w-9 h-9 rounded-full border border-border bg-card/60 text-foreground transition-colors duration-300 hover:bg-accent"
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card/60 text-sm font-medium transition-colors duration-300 hover:bg-accent"
          data-testid="language-switcher"
        >
          <Languages className="w-4 h-4" />
          <span className="font-deva">{current.native}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass rounded-2xl">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            data-testid={`lang-option-${l.code}`}
            className="rounded-xl cursor-pointer"
          >
            <span className="font-deva mr-2">{l.native}</span>
            <span className="text-muted-foreground text-xs">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
