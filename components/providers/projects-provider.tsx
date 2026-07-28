"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type ProjectSummary = {
  _id: Id<"contentProjects">;
  title?: string;
  inputContent: string;
  inputType: "topic" | "article";
  status: string;
  createdAt: number;
  publishedTo?: string[];
  hasBlog: boolean;
  hasSocial: boolean;
  hasEmail: boolean;
  hasSeo: boolean;
};

type ProjectsContextValue = {
  projects: ProjectSummary[] | undefined;
};

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: undefined,
});

export function useProjects() {
  return useContext(ProjectsContext);
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const projects = useQuery(api.contentProjects.getUserProjectsSummary);

  const value = useMemo(() => ({ projects }), [projects]);

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
