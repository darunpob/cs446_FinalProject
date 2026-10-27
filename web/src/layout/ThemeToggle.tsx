import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeChoice = "light" | "dark";

const THEME_KEY = "bu-lf-theme";

function currentTheme(): ThemeChoice {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>(currentTheme);

  const toggle = () => {
    const nextTheme: ThemeChoice = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (storageError) {
      console.warn("Theme preference could not be saved", storageError);
    }
  };

  const label = theme === "dark" ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-10 cursor-pointer place-items-center rounded-xl text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
    >
      {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
