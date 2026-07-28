import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <header className="fixed z-20 w-full px-2">
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-transparent px-6 backdrop-blur-none lg:px-12">
          <div className="flex items-center justify-between py-2 lg:py-2">
            <Link href="/" aria-label="home" className="flex items-center space-x-2">
              <Logo />
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 pt-16 pb-24">
        {/* Giant 404 Background */}
        <div className="absolute inset-0 flex flex-row items-center justify-center pointer-events-none -z-10 select-none overflow-hidden">
          <div className="flex items-center justify-center text-[50vw] md:text-[38vw] font-bold text-foreground/[0.03] dark:text-foreground/[0.05] leading-none tracking-tighter mix-blend-multiply dark:mix-blend-lighten">
            <span>4</span>
            {/* Custom 0 with Diamond */}
            <div className="relative flex items-center justify-center w-[35vw] h-[35vw] md:w-[25vw] md:h-[25vw] mx-[-1vw]">
              <div className="absolute inset-0 border-[3.5vw] md:border-[2.5vw] border-foreground/[0.03] dark:border-foreground/[0.05] rounded-full"></div>
              <div className="w-[12vw] h-[12vw] md:w-[8vw] md:h-[8vw] bg-foreground/[0.03] dark:bg-foreground/[0.05] rotate-45"></div>
            </div>
            <span>4</span>
          </div>
        </div>

        {/* Gradient fade overlay for the bottom half to blend text */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none -z-10"></div>

        {/* Foreground Content */}
        <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto">
          <h1 className="text-3xl md:text-5xl font-playfair tracking-tight text-foreground">
            404 <span className="mx-1 md:mx-2 opacity-50">|</span> Page Not Found
          </h1>
          <div className="space-y-1.5 text-sm md:text-base">
            <p className="text-muted-foreground">This page missed the mark.</p>
            <p className="text-muted-foreground">We&apos;ll help your campaigns hit theirs.</p>
          </div>
          <div className="pt-2">
            <Button asChild className="rounded-md px-8 h-12" size="lg">
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
