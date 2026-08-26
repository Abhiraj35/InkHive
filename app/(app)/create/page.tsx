"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, Lightbulb, } from "lucide-react";
import Link from "next/link";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3, duration: 1.5 } },
  },
};

export default function CreatePage() {
  const router = useRouter();
  const { userId } = useAuth();
  const createProject = useMutation(api.contentProjects.createProject);

  const [inputType, setInputType] = useState<"topic" | "article">("topic");
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!userId) {
      toast.error("Please sign in to create content");
      return;
    }

    const inputContent = inputType === "topic" ? topic : article;
    const trimmedInput = inputContent.trim();

    if (!trimmedInput) {
      toast.error(
        inputType === "topic"
          ? "Please enter a topic"
          : "Please paste an article"
      );
      return;
    }

    if (inputType === "topic" && trimmedInput.length < 10) {
      toast.error("Topic must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create project in Convex
      const projectId = await createProject({
        inputType,
        inputContent: inputContent.trim(),
      });

      // Trigger Inngest workflow
      const response = await fetch("/api/trigger-inngest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          inputType,
          inputContent: trimmedInput,
          generationMode: "grounded",
          researchEnabled: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation trigger failed: ${response.status}`);
      }

      toast.success("AI Agents initialized! Generating content...");
      router.push(`/dashboard/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to initialize content generation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exampleTopics = [
    "The Future of Remote Work in 2024",
    "Sustainable Living: Small Changes, Big Impact",
    "How AI is Transforming Healthcare",
    "The Art of Mindful Productivity",
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground relative">
      {/* Background Gradients from Hero */}
      <div
        aria-hidden
        className="z-0 absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
      >
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 size-full bg-[radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button asChild size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-foreground">
              New Content Task
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10">
        <AnimatedGroup variants={transitionVariants}>
          {/* Hero text */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
              Initialize Generation
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Provide topic or paste an existing article. Our multi-agent AI will process it and build out your content empire.
            </p>
          </div>

          {/* Input Section */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl shadow-black/5 p-6 sm:p-8"
          >
            <Tabs
              value={inputType}
              onValueChange={(v) => setInputType(v as "topic" | "article")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/10 p-1 rounded-xl mb-8">
                <TabsTrigger 
                  value="topic"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm  data-[state=active]:border data-[state=active]:border-white/10 rounded-lg py-2.5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" data-icon="inline-start" />
                    <span>Topic</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="article"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/10 rounded-lg py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" data-icon="inline-start" />
                    <span>Article</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="topic" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <Label htmlFor="topic" className="text-foreground font-medium">
                    Enter Topic
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., The Future of AI in Content Marketing"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isSubmitting}
                    className="border-white/10 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary rounded-xl py-6 text-lg"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>Minimum 10 characters</p>
                    <span>{topic.length} / 10+</span>
                  </div>
                </div>

                {/* Example Topics */}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-3">Example Topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleTopics.map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setTopic(example)}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 text-foreground rounded-full border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="article" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <Label htmlFor="article" className="text-foreground font-medium">
                    Source Material
                  </Label>
                  <Textarea
                    id="article"
                    placeholder="Paste your full article here to repurpose it..."
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    disabled={isSubmitting}
                    rows={8}
                    className="border-white/10 bg-background/50 focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none p-4"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <p>AI will extract key insights and adapt the content</p>
                    <span>{article.length} chars</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="mt-10 pt-8 border-t border-white/10">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-foreground text-background hover:bg-foreground/90 py-6 text-lg rounded-xl shadow-sm transition-all"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Initializing Agents...
                  </>
                ) : (
                  <>
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </form>
        </AnimatedGroup>
      </main>
    </div>
  );
}
