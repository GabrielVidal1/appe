import { Button } from "@/components/ui/button";
import { Github, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  className?: string;
}

const Navbar = ({ className }: NavbarProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav
      className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Logo and Home */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
              <div className="grid grid-cols-2 grid-rows-2 gap-0 w-full h-full text-xs font-bold p-1">
                <span className="flex items-center justify-center">A</span>
                <span className="flex items-center justify-center">P</span>
                <span className="flex items-center justify-center">P</span>
                <span className="flex items-center justify-center">E</span>
              </div>
            </div>
            <span className="hidden sm:block">
              AI Processing Price Estimator
            </span>
          </Link>
        </div>

        {/* Right side - GitHub and Theme toggle */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/GabrielVidal1/prompt-price-predictor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full aspect-square"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
