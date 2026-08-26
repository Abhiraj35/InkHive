// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "core/architecture.mdx": () => import("../content/docs/core/architecture.mdx?collection=docs"), "core/data-model.mdx": () => import("../content/docs/core/data-model.mdx?collection=docs"), "core/workflows.mdx": () => import("../content/docs/core/workflows.mdx?collection=docs"), "getting-started/installation.mdx": () => import("../content/docs/getting-started/installation.mdx?collection=docs"), "getting-started/overview.mdx": () => import("../content/docs/getting-started/overview.mdx?collection=docs"), "reference/api-reference.mdx": () => import("../content/docs/reference/api-reference.mdx?collection=docs"), "reference/contributing.mdx": () => import("../content/docs/reference/contributing.mdx?collection=docs"), "reference/deployment.mdx": () => import("../content/docs/reference/deployment.mdx?collection=docs"), }),
};
export default browserCollections;