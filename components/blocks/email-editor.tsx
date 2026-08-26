import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, X, Loader2, Check, Mail, Monitor, Smartphone, Copy } from "lucide-react";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ContentProject = Doc<"contentProjects">;

export function EmailEditor({ project }: { project: ContentProject }) {
    const updateEmailNewsletter = useMutation(
        api.contentProjects.updateEmailNewsletter,
    );
    const [isEditing, setIsEditing] = useState(false);
    const [htmlContent, setHtmlContent] = useState("");
    const [plainText, setPlainText] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(
        project.emailNewsletter?.selectedSubjectLine || 0,
    );
    const [previewWidth, setPreviewWidth] = useState("650px");
    const [previewTab, setPreviewTab] = useState("preview");

    const handleSave = async () => {
        try {
            await updateEmailNewsletter({
                projectId: project._id,
                htmlContent,
                plainText,
                selectedSubjectLine: selectedSubject,
            });
            toast.success("Email newsletter saved!");
            setIsEditing(false);
        } catch {
            toast.error("Failed to save");
        }
    };

    const handleToggleEdit = () => {
        if (!isEditing) {
            setHtmlContent(project.emailNewsletter?.htmlContent || "");
            setPlainText(project.emailNewsletter?.plainText || "");
            setSelectedSubject(project.emailNewsletter?.selectedSubjectLine || 0);
        }
        setIsEditing(!isEditing);
    };

    if (!project.emailNewsletter) {
        return (
            <div className="text-center py-24 px-6 bg-white/5 backdrop-blur-sm rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
                {project.status === "generating" ? (
                    <div className="flex flex-col items-center relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 shadow-inner border border-primary/20 animate-pulse">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                        <h4 className="text-foreground text-2xl font-semibold tracking-tight">
                            Agents are composing your newsletter
                        </h4>
                        <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
                            Crafting personalized copy and responsive templates for your audience.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-sm">
                            <Mail className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h4 className="text-muted-foreground text-2xl font-medium tracking-tight">
                            Email content will appear here
                        </h4>
                        <p className="text-muted-foreground/60 mt-3">
                            Once generated, you&apos;ll be able to preview and edit it here.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-12">
                <div className="flex items-center gap-5 mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                        <Mail className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold tracking-tight text-foreground">Email Newsletter</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500/50" />
                            {project.emailNewsletter.subjectLines.length} professional options generated
                        </p>
                    </div>
                </div>

                {/* Subject Lines */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <Label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                            Subject Line Options
                        </Label>
                    </div>
                    <div className="grid gap-3">
                        {project.emailNewsletter.subjectLines.map(
                            (subject: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`p-5 rounded-2xl border transition-all duration-300 group relative ${selectedSubject === idx
                                        ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]"
                                        : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4"
                                        }`}
                                    onClick={() => setSelectedSubject(idx)}
                                >
                                    <div className="flex items-start gap-5">
                                        <div
                                            className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${selectedSubject === idx
                                                ? "border-primary bg-primary scale-110 shadow-lg shadow-primary/20"
                                                : "border-muted-foreground/30 group-hover:border-primary/50"
                                                }`}
                                        >
                                            {selectedSubject === idx && (
                                                <Check className="w-3 h-3 text-background" strokeWidth={4} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`text-base leading-relaxed transition-colors ${selectedSubject === idx ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground/80"}`}>
                                                {subject}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>

                {/* Email Content */}
                <div className="border-t border-white/5 pt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-2xl font-bold tracking-tight text-foreground">
                            Editor & Preview
                        </h4>
                        <Button
                            variant="outline"
                            onClick={handleToggleEdit}
                            className={`rounded-xl px-5 h-11 transition-all duration-300 ${isEditing
                                ? "bg-white/10 border-white/20 hover:bg-white/20"
                                : "bg-primary text-primary-foreground border-transparent hover:bg-primary/90 shadow-lg shadow-primary/10"
                                }`}
                        >
                            {isEditing ? (
                                <>
                                    <X className="h-4 w-4 mr-2.5" />
                                    Cancel Edit
                                </>
                            ) : (
                                <>
                                    <Edit3 className="h-4 w-4 mr-2.5" />
                                    Customize Content
                                </>
                            )}
                        </Button>
                    </div>

                    {isEditing ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="email-html-content" className="text-foreground font-semibold text-sm ml-1 flex items-center gap-2">
                                        HTML Template
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono text-muted-foreground uppercase">Advanced</span>
                                    </Label>
                                    <Textarea
                                        id="email-html-content"
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                        rows={15}
                                        className="font-mono text-xs leading-loose bg-black/20 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl p-8 resize-y shadow-inner transition-all focus:border-primary/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="email-plain-text" className="text-foreground font-semibold text-sm ml-1">Plain Text Fallback</Label>
                                    <Textarea
                                        id="email-plain-text"
                                        value={plainText}
                                        onChange={(e) => setPlainText(e.target.value)}
                                        rows={8}
                                        className="bg-black/20 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl p-8 leading-relaxed resize-y shadow-inner transition-all focus:border-primary/50"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl font-semibold"
                                >
                                    <Save className="h-4 w-4 mr-2.5" />
                                    Apply Changes
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
                                    <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-auto shadow-inner backdrop-blur-sm">
                                        <TabsTrigger value="preview" className="rounded-xl px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                                            Live Preview
                                        </TabsTrigger>
                                        <TabsTrigger value="plain" className="rounded-xl px-6 py-2.5 text-sm font-medium data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all">
                                            Text Version
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-inner">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewWidth("650px")}
                                                className={`h-9 px-4 rounded-xl transition-all ${previewWidth === "650px" ? "bg-white/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                <Monitor className="h-4 w-4 mr-2" />
                                                <span className="text-xs font-semibold">Desktop</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewWidth("375px")}
                                                className={`h-9 px-4 rounded-xl transition-all ${previewWidth === "375px" ? "bg-white/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                <Smartphone className="h-4 w-4 mr-2" />
                                                <span className="text-xs font-semibold">Mobile</span>
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-medium"
                                            onClick={() => {
                                                const content = previewTab === "preview" ? project.emailNewsletter?.htmlContent || "" : project.emailNewsletter?.plainText || "";
                                                navigator.clipboard.writeText(content);
                                                toast.success("Copied to clipboard!");
                                            }}
                                        >
                                            <Copy className="h-4 w-4 mr-2.5 text-primary" />
                                            Copy All
                                        </Button>
                                    </div>
                                </div>

                                <TabsContent value="preview" className="mt-0 outline-none">
                                    <div className="bg-black/20 rounded-[32px] p-6 sm:p-12 border border-white/5 shadow-inner">
                                        <div className="relative mx-auto transition-all duration-500 ease-in-out border border-white/10 rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-white/20" style={{ maxWidth: previewWidth }}>
                                            {/* Modern Mail Header */}
                                            <div className="bg-[#f8f9fa] border-b border-gray-200 p-6 flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Secure Email Preview</div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-xs font-bold text-gray-500 w-12 pt-0.5">From:</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">IH</div>
                                                            <span className="text-sm font-semibold text-gray-800">InkHive Marketing <span className="text-gray-400 font-normal">&lt;ai@inkhive.com&gt;</span></span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-xs font-bold text-gray-500 w-12 pt-0.5">Subject:</span>
                                                        <span className="text-sm font-bold text-gray-900 leading-tight">
                                                            {project.emailNewsletter.subjectLines[selectedSubject]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <iframe
                                                title="Email newsletter preview"
                                                srcDoc={project.emailNewsletter.htmlContent}
                                                sandbox=""
                                                className="block w-full min-h-[650px] bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground/40">
                                        <div className="h-px w-8 bg-current" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">
                                            Responsive simulation
                                        </p>
                                        <div className="h-px w-8 bg-current" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="plain" className="mt-0 outline-none">
                                    <div className="bg-black/20 rounded-[32px] p-6 sm:p-12 border border-white/5 shadow-inner">
                                        <div className="bg-background/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="px-8 py-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Standard Plain Text</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-muted-foreground/50">8-bit ASCII</span>
                                            </div>
                                            <pre className="p-10 text-[14px] leading-loose whitespace-pre-wrap text-foreground/80 font-mono max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                                {project.emailNewsletter.plainText}
                                            </pre>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
