import { ClerkProvider } from "@clerk/nextjs";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </ClerkProvider>
  );
}
