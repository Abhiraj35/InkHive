/**
 * Convex API for Content Projects
 *
 * Provides CRUD operations and real-time queries for content projects
 *
 * Security Model:
 * - Mutations called by Inngest (background jobs) don't require auth since projectId
 *   is cryptographically random and hard to guess
 * - User-facing mutations (create, delete, user edits) still require auth
 * - Queries filter by userId to prevent unauthorized access
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "./auth";

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Create a new content project
 * Requires authentication - called from UI
 */
export const createProject = mutation({
  args: {
    inputType: v.union(v.literal("topic"), v.literal("article")),
    inputContent: v.string(),
  },
  returns: v.id("contentProjects"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("contentProjects", {
      userId,
      inputType: args.inputType,
      inputContent: args.inputContent,
      status: "draft",
      generationMode: "grounded",
      jobStatus: {
        research: "pending",
        blogPost: "pending",
        socialPosts: "pending",
        emailNewsletter: "pending",
        seoMetadata: "pending",
      },
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Get all projects for the current user
 * Requires authentication
 */
export const getUserProjects = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const projects = await ctx.db
      .query("contentProjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return projects;
  },
});

/**
 * Get lightweight project summaries for list views
 * Returns only the fields needed for the dashboard grid and sidebar
 * Requires authentication
 */
export const getUserProjectsSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const projects = await ctx.db
      .query("contentProjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return projects.map((project) => ({
      _id: project._id,
      title: project.blogPost?.title,
      inputContent: project.inputContent.slice(0, 150),
      inputType: project.inputType,
      status: project.status,
      createdAt: project.createdAt,
      publishedTo: project.publishedTo,
      hasBlog: !!project.blogPost,
      hasSocial: !!project.socialPosts,
      hasEmail: !!project.emailNewsletter,
      hasSeo: !!project.seoMetadata,
    }));
  },
});

/**
 * Get a single project by ID
 * Requires authentication - verifies user ownership
 */
export const getProject = query({
  args: {
    projectId: v.id("contentProjects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      return null;
    }

    return project;
  },
});

/**
 * Get project by ID (for Inngest - no auth required)
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const getProjectById = query({
  args: {
    projectId: v.id("contentProjects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Update project status
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("contentProjects"),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled"),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      status: args.status,
      updatedAt: Date.now(),
      completedAt:
        args.status === "completed" ? Date.now() : project.completedAt,
    });
  },
});

/**
 * Update job status for a specific step
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const updateJobStatus = mutation({
  args: {
    projectId: v.id("contentProjects"),
    jobName: v.union(
      v.literal("research"),
      v.literal("blogPost"),
      v.literal("socialPosts"),
      v.literal("emailNewsletter"),
      v.literal("seoMetadata"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped"),
      v.literal("canceled"),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const currentJobStatus = project.jobStatus || {};
    await ctx.db.patch(args.projectId, {
      jobStatus: {
        ...currentJobStatus,
        [args.jobName]: args.status,
      },
      updatedAt: Date.now(),
    });
  },
});

export const setGenerationMode = mutation({
  args: {
    projectId: v.id("contentProjects"),
    generationMode: v.union(v.literal("grounded"), v.literal("classic")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      generationMode: args.generationMode,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cancel a generating project
 * Requires authentication - called from UI
 * Preserves already-completed jobs and their content
 */
export const cancelProject = mutation({
  args: {
    projectId: v.id("contentProjects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    if (project.status !== "generating") {
      throw new Error("Can only cancel projects that are currently generating");
    }

    const jobs = project.jobStatus || {};
    const preserveResearch = (s?: string): "completed" | "skipped" | "canceled" =>
      s === "completed" || s === "skipped" ? s : "canceled";
    const preserveJob = (s?: string): "completed" | "canceled" =>
      s === "completed" ? "completed" : "canceled";

    await ctx.db.patch(args.projectId, {
      status: "canceled",
      jobStatus: {
        research: preserveResearch(jobs.research),
        blogPost: preserveJob(jobs.blogPost),
        socialPosts: preserveJob(jobs.socialPosts),
        emailNewsletter: preserveJob(jobs.emailNewsletter),
        seoMetadata: preserveJob(jobs.seoMetadata),
      },
      updatedAt: Date.now(),
    });
  },
});

export const updateResearchStatus = mutation({
  args: {
    projectId: v.id("contentProjects"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const currentJobStatus = project.jobStatus || {};
    const existingResearch = project.research;

    await ctx.db.patch(args.projectId, {
      jobStatus: {
        ...currentJobStatus,
        research: args.status,
      },
      research: {
        status: args.status,
        attemptedAt: now,
        researchedAt:
          args.status === "completed"
            ? now
            : existingResearch?.researchedAt,
        errorCode: args.errorCode,
        errorMessage: args.errorMessage,
        keyFindings: existingResearch?.keyFindings || [],
        trendingAngles: existingResearch?.trendingAngles || [],
        sources: existingResearch?.sources || [],
      },
      updatedAt: now,
    });
  },
});

export const saveResearch = mutation({
  args: {
    projectId: v.id("contentProjects"),
    keyFindings: v.array(v.string()),
    trendingAngles: v.array(v.string()),
    sources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        domain: v.string(),
        publishedAt: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const currentJobStatus = project.jobStatus || {};

    await ctx.db.patch(args.projectId, {
      jobStatus: {
        ...currentJobStatus,
        research: "completed",
      },
      research: {
        status: "completed",
        attemptedAt: now,
        researchedAt: now,
        keyFindings: args.keyFindings,
        trendingAngles: args.trendingAngles,
        sources: args.sources,
      },
      updatedAt: now,
    });
  },
});

/**
 * Save generated blog post
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const saveBlogPost = mutation({
  args: {
    projectId: v.id("contentProjects"),
    title: v.string(),
    content: v.string(),
    excerpt: v.string(),
    readingTime: v.number(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      blogPost: {
        title: args.title,
        content: args.content,
        excerpt: args.excerpt,
        readingTime: args.readingTime,
        isEdited: false,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update blog post (user edit)
 * Requires authentication - called from UI
 */
export const updateBlogPost = mutation({
  args: {
    projectId: v.id("contentProjects"),
    title: v.string(),
    content: v.string(),
    excerpt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const currentBlogPost = project.blogPost;
    if (!currentBlogPost) {
      throw new Error("Blog post not found");
    }

    // Calculate new reading time based on content
    const wordCount = args.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

    await ctx.db.patch(args.projectId, {
      blogPost: {
        ...currentBlogPost,
        title: args.title,
        content: args.content,
        excerpt: args.excerpt,
        readingTime,
        isEdited: true,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save generated social posts
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const saveSocialPosts = mutation({
  args: {
    projectId: v.id("contentProjects"),
    twitter: v.string(),
    linkedin: v.string(),
    facebook: v.string(),
    instagram: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      socialPosts: {
        twitter: {
          text: args.twitter,
          status: "draft",
        },
        linkedin: {
          text: args.linkedin,
          status: "draft",
        },
        facebook: {
          text: args.facebook,
          status: "draft",
        },
        instagram: {
          text: args.instagram,
          status: "draft",
        },
        // Medium publishing uses blog post content directly via the blog tab flow.
        medium: {
          text: "",
          status: "draft",
        },
        isEdited: false,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update social post (user edit)
 * Requires authentication - called from UI
 */
export const updateSocialPost = mutation({
  args: {
    projectId: v.id("contentProjects"),
    platform: v.union(
      v.literal("twitter"),
      v.literal("linkedin"),
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("medium"),
    ),
    text: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const currentSocialPosts = project.socialPosts;
    if (!currentSocialPosts) {
      throw new Error("Social posts not found");
    }

    await ctx.db.patch(args.projectId, {
      socialPosts: {
        ...currentSocialPosts,
        [args.platform]: {
          ...currentSocialPosts[args.platform],
          text: args.text,
          ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
        },
        isEdited: true,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save generated email newsletter
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const saveEmailNewsletter = mutation({
  args: {
    projectId: v.id("contentProjects"),
    subjectLines: v.array(v.string()),
    previewText: v.string(),
    htmlContent: v.string(),
    plainText: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      emailNewsletter: {
        subjectLines: args.subjectLines,
        previewText: args.previewText,
        htmlContent: args.htmlContent,
        plainText: args.plainText,
        selectedSubjectLine: 0,
        status: "draft",
        isEdited: false,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update email newsletter (user edit)
 * Requires authentication - called from UI
 */
export const updateEmailNewsletter = mutation({
  args: {
    projectId: v.id("contentProjects"),
    htmlContent: v.string(),
    plainText: v.string(),
    selectedSubjectLine: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const currentEmail = project.emailNewsletter;
    if (!currentEmail) {
      throw new Error("Email newsletter not found");
    }

    await ctx.db.patch(args.projectId, {
      emailNewsletter: {
        ...currentEmail,
        htmlContent: args.htmlContent,
        plainText: args.plainText,
        selectedSubjectLine: args.selectedSubjectLine,
        isEdited: true,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save generated SEO metadata
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const saveSeoMetadata = mutation({
  args: {
    projectId: v.id("contentProjects"),
    title: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const normalizedSlug = normalizeSlug(args.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }

    await ctx.db.patch(args.projectId, {
      seoMetadata: {
        title: args.title,
        description: args.description,
        keywords: args.keywords,
        slug: normalizedSlug,
        isEdited: false,
      },
      publicSlug: normalizedSlug,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update SEO metadata (user edit)
 * Requires authentication - called from UI
 */
export const updateSeoMetadata = mutation({
  args: {
    projectId: v.id("contentProjects"),
    title: v.string(),
    description: v.string(),
    keywords: v.array(v.string()),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const currentSeo = project.seoMetadata;
    if (!currentSeo) {
      throw new Error("SEO metadata not found");
    }
    const normalizedSlug = normalizeSlug(args.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }

    await ctx.db.patch(args.projectId, {
      seoMetadata: {
        title: args.title,
        description: args.description,
        keywords: args.keywords,
        slug: normalizedSlug,
        isEdited: true,
      },
      publicSlug: normalizedSlug,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get a public blog post by slug
 * Public route data only, no private project fields
 */
export const getPublicPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedSlug = normalizeSlug(args.slug);
    if (!normalizedSlug) {
      return null;
    }

    const projects = await ctx.db
      .query("contentProjects")
      .withIndex("by_public_slug_and_status", (q) =>
        q.eq("publicSlug", normalizedSlug).eq("status", "completed"),
      )
      .order("desc")
      .take(5);

    const project = projects.find((item) => item.blogPost && item.seoMetadata);
    if (!project || !project.blogPost || !project.seoMetadata) {
      return null;
    }

    return {
      title: project.blogPost.title,
      content: project.blogPost.content,
      excerpt: project.blogPost.excerpt,
      readingTime: project.blogPost.readingTime,
      slug: project.seoMetadata.slug,
      seoTitle: project.seoMetadata.title,
      seoDescription: project.seoMetadata.description,
      seoKeywords: project.seoMetadata.keywords,
      publishedAt: project.completedAt ?? project.updatedAt,
      updatedAt: project.updatedAt,
    };
  },
});

/**
 * Update publishing status for a platform
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const updatePublishStatus = mutation({
  args: {
    projectId: v.id("contentProjects"),
    platform: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    let socialPosts = project.socialPosts;
    let emailNewsletter = project.emailNewsletter;
    const publishedTo = [...(project.publishedTo ?? [])];

    // Update specific platform
    if (
      args.platform === "twitter" ||
      args.platform === "linkedin" ||
      args.platform === "facebook" ||
      args.platform === "instagram" ||
      args.platform === "medium"
    ) {
      if (socialPosts) {
        socialPosts = {
          ...socialPosts,
          [args.platform]: {
            ...socialPosts[args.platform],
            status: args.status,
            ...(args.status === "published" && { publishedAt: now }),
            ...(args.error && { error: args.error }),
          },
        };
      }
    } else if (args.platform === "email") {
      if (emailNewsletter) {
        emailNewsletter = {
          ...emailNewsletter,
          status: args.status,
          ...(args.status === "published" && { publishedAt: now }),
          ...(args.error && { error: args.error }),
        };
      }
    }

    // Update publishedTo array
    if (args.status === "published" && !publishedTo.includes(args.platform)) {
      publishedTo.push(args.platform);
    }

    await ctx.db.patch(args.projectId, {
      ...(socialPosts && { socialPosts }),
      ...(emailNewsletter && { emailNewsletter }),
      publishedTo,
      lastPublishedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Record error
 * NO AUTH REQUIRED - called by Inngest
 * Security: projectId is cryptographically random and hard to guess
 */
export const recordError = mutation({
  args: {
    projectId: v.id("contentProjects"),
    message: v.string(),
    step: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      status: "failed",
      error: {
        message: args.message,
        step: args.step,
        timestamp: Date.now(),
        details: args.details,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete project
 * Requires authentication - called from UI
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("contentProjects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.delete(args.projectId);
  },
});
