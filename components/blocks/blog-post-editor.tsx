import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Edit3, Save, X, FileText, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { trackEvent } from "@/lib/analytics";

type ContentProject = Doc<"contentProjects">;

export function BlogPostEditor({ project }: { project: ContentProject }) {
    const updateBlogPost = useMutation(api.contentProjects.updateBlogPost);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(project.blogPost?.title || "");
    const [content, setContent] = useState(project.blogPost?.content || "");
    const [excerpt, setExcerpt] = useState(project.blogPost?.excerpt || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isMediumDialogOpen, setIsMediumDialogOpen] = useState(false);
    const [isPreparingMedium, setIsPreparingMedium] = useState(false);

    // Update local state when project updates
    useEffect(() => {
        if (project.blogPost && !project.blogPost.isEdited) {
            setTitle(project.blogPost.title);
            setContent(project.blogPost.content);
            setExcerpt(project.blogPost.excerpt);
        }
    }, [project.blogPost]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateBlogPost({
                projectId: project._id,
                title,
                content,
                excerpt,
            });
            toast.success("Blog post saved!");
            setIsEditing(false);
        } catch {
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    if (!project.blogPost) {
        return (
            <div className="text-center py-20 px-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm">
                {project.status === "generating" ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <p className="text-foreground text-lg font-medium tracking-tight">
                            Agents are writing your blog post...
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This usually takes 15-20 seconds
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-lg">
                            Blog post will appear here after generation
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const blogPost = project.blogPost;
    const handleOpenMedium = () => {
        setIsPreparingMedium(true);
        const mediumWindow = window.open(
            "https://medium.com/new-story",
            "_blank",
            "noopener,noreferrer",
        );

        const htmlBody = markdownToHtml(blogPost.content);
        const htmlDocument = `<h1>${blogPost.title}</h1><p><em>${blogPost.excerpt}</em></p>${htmlBody}`;
        const plainText = `${blogPost.title}\n\n${blogPost.excerpt}\n\n${blogPost.content}`;

        trackEvent("medium_open_click", { projectId: project._id });

        const copyAndNotify = async () => {
            try {
                if (typeof ClipboardItem !== "undefined") {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            "text/html": new Blob([htmlDocument], { type: "text/html" }),
                            "text/plain": new Blob([plainText], { type: "text/plain" }),
                        }),
                    ]);
                } else {
                    await navigator.clipboard.writeText(plainText);
                }
                toast.success("Ready to paste in Medium", {
                    description:
                        "Your full blog content was copied automatically. Use Cmd+V (Mac) or Ctrl+V (Windows) in the Medium editor.",
                    duration: 7000,
                });
            } catch {
                toast.error("Could not copy automatically", {
                    description: "Use Copy as HTML or Copy as Markdown, then paste in Medium.",
                });
            } finally {
                mediumWindow?.focus();
                setIsPreparingMedium(false);
            }
        };

        void copyAndNotify();
        setIsMediumDialogOpen(false);
    };

    const handleOpenMediumDialog = () => {
        trackEvent("medium_help_viewed", { projectId: project._id });
        setIsMediumDialogOpen(true);
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm p-4 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Blog Post</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-2">
                            {blogPost.readingTime} min read
                            {blogPost.isEdited && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] sm:text-xs">
                                    Edited
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isEditing && (
                        <Button
                            onClick={handleOpenMediumDialog}
                            disabled={isPreparingMedium}
                            className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Medium
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => {
                            setTitle(blogPost.title);
                            setContent(blogPost.content);
                            setExcerpt(blogPost.excerpt);
                            setIsEditing(!isEditing);
                        }}
                        className="bg-transparent border-white/10 hover:bg-white/5 text-foreground transition-all"
                    >
                        {isEditing ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Post
                            </>
                        )}
                    </Button>
                    {isEditing && (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-6 bg-background/50 p-4 sm:p-6 rounded-2xl border border-white/5">
                    <div className="space-y-2">
                        <Label htmlFor="blog-post-title" className="text-foreground font-medium text-sm ml-1">Title</Label>
                        <Input
                            id="blog-post-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-base sm:text-lg py-3 sm:py-6"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="blog-post-excerpt" className="text-foreground font-medium text-sm ml-1">Excerpt</Label>
                        <Textarea
                            id="blog-post-excerpt"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            rows={3}
                            className="bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none p-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="blog-post-content" className="text-foreground font-medium text-sm ml-1">Content (Markdown)</Label>
                        <Textarea
                            id="blog-post-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={20}
                            className="font-mono text-xs sm:text-sm bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-xl p-4 sm:p-6 leading-relaxed resize-y"
                        />
                    </div>
                </div>
            ) : (
                <div className="mx-auto w-full max-w-4xl">
                    <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground mb-4 sm:mb-6 wrap-break-word">
                        {blogPost.title}
                    </h1>
                    <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 italic border-l-4 border-primary/50 pl-4 sm:pl-6 py-3 bg-primary/5 rounded-r-xl wrap-break-word leading-relaxed">
                        {blogPost.excerpt}
                    </p>
                    <MarkdownRenderer content={blogPost.content} className="wrap-break-word" />
                </div>
            )}

            <Dialog open={isMediumDialogOpen} onOpenChange={setIsMediumDialogOpen}>
                <DialogContent className="sm:max-w-130">
                    <DialogHeader>
                        <DialogTitle>Publish to Medium</DialogTitle>
                        <DialogDescription>
                            We’ll copy your blog content automatically, then open Medium in a new tab.
                            Paste there using
                        </DialogDescription>
                        <DialogDescription className="bg-white/10 p-2 rounded-md w-fit font-mono text-xs sm:text-sm border-dashed border">
                            Cmd+V (Mac) or Ctrl+V (Windows)
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsMediumDialogOpen(false)}
                            disabled={isPreparingMedium}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleOpenMedium} disabled={isPreparingMedium}>
                            {isPreparingMedium ? "Preparing..." : "Continue to Medium"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
