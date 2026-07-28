import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ProjectsProvider } from "@/components/providers/projects-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <ProjectsProvider>{children}</ProjectsProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
