import { Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground font-body">
          © 2026 <span className="text-primary font-semibold">MinskDvizh</span> — Афиша Минска
        </p>
        <a
          href="https://t.me/MinskDvizhBot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary font-body font-medium hover:text-accent transition-colors"
        >
          <Send className="h-4 w-4" />
          @MinskDvizhBot
        </a>
      </div>
    </footer>
  );
};

export default Footer;
