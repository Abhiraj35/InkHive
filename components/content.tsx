import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatDate, truncateText } from "@/lib/utils";
import { Plus, Loader2, FileText, Share2, Mail, Globe, ArrowRight, Box, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedGroup } from "@/components/ui/animated-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Id } from '@/convex/_generated/dataModel';
import { DeleteResource } from '@/components/delete-resource';
import { useUser } from '@clerk/nextjs';
import { useProjects } from '@/components/providers/projects-provider';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3, duration: 1.5 } },
  },
};

export default function Content() {
  const { projects } = useProjects();
  const deleteProject = useMutation(api.contentProjects.deleteProject);
  const { user, isLoaded } = useUser();

  const [projectToDelete, setProjectToDelete] = useState<{ id: Id<"contentProjects">, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProject({ projectId: projectToDelete.id });
      toast.success("Project deleted successfully");
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: Id<"contentProjects">, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete({ id, name });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-15 lg:py-35 pt-20 md:pt-20 lg:pt-25 xl:pt-30 relative z-10">
      <AnimatedGroup variants={transitionVariants}>
        {/* Welcome Banner */}
        <div className="mb-10 p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-medium tracking-tight text-foreground">
                Welcome {isLoaded ? user?.firstName : "back"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Ready to expand your content empire? Start a new generation task or manage your existing AI projects.
            </p>
          </div>
        </div>

        {/* Projects Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-foreground mb-1">
              Your Content Empire
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage and publish your AI-generated assets
            </p>
          </div>
          {projects && projects.length > 0 && (
            <Link href="/create">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </Link>
          )}
        </div>
      </AnimatedGroup>

      {projects === undefined ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <AnimatedGroup variants={transitionVariants}>
          <Card className="bg-white/5 border-white/10 shadow-sm backdrop-blur-sm rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardContent className="pt-16 pb-16 text-center relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-sm shadow-black/10">
                <Box className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-medium tracking-tight text-foreground mb-3">
                No projects found
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Initialize your first content seed and let our AI agents build a
                thriving ecosystem for you.
              </p>
              <Link href="/create">
                <Button
                  size="lg"
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-sm px-8"
                >
                  Start Creating
                </Button>
              </Link>
            </CardContent>
          </Card>
        </AnimatedGroup>
      ) : (
        /* Projects List */
        <AnimatedGroup variants={transitionVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project._id} href={`/dashboard/${project._id}`} className="block h-full group">
              <Card className="h-full bg-white/5 border-white/10 shadow-sm hover:shadow-md hover:bg-white/10 transition-all duration-300 rounded-2xl overflow-hidden relative">
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="font-medium tracking-tight text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {project.title || truncateText(project.inputContent, 50)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl bg-background/95 backdrop-blur-md border-white/10">
                        <DropdownMenuItem
                          onClick={(e) => confirmDelete(e, project._id, project.title || truncateText(project.inputContent, 50))}
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-5">
                    Source: {truncateText(project.inputContent, 100)}
                  </p>

                  {/* Content Types Preview */}
                  <div className="flex items-center gap-2 flex-wrap mt-auto">
                    {project.hasBlog && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
                        <FileText className="w-3 h-3 text-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Blog
                        </span>
                      </div>
                    )}
                    {project.hasSocial && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
                        <Share2 className="w-3 h-3 text-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Social
                        </span>
                      </div>
                    )}
                    {project.hasEmail && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
                        <Mail className="w-3 h-3 text-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Email
                        </span>
                      </div>
                    )}
                    {project.hasSeo && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-md">
                        <Globe className="w-3 h-3 text-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          SEO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Published Platforms */}
                  {project.publishedTo && project.publishedTo.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-1.5">
                        {project.publishedTo.map((platform) => (
                          <Badge
                            key={platform}
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </AnimatedGroup>
      )}

      <DeleteResource
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        resourceType="Project"
        resourceName={projectToDelete?.name || ""}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
}