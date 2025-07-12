
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" />
          <span>by Gabriel Vidal with</span>
          <a 
            href="https://lovable.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 font-medium text-foreground hover:underline"
          >
            Lovable
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
