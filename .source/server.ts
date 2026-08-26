// @ts-nocheck
import * as __fd_glob_12 from "../content/docs/reference/deployment.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/reference/contributing.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/reference/api-reference.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/getting-started/overview.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/getting-started/installation.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/core/workflows.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/core/data-model.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/core/architecture.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/reference/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/getting-started/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/core/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "core/meta.json": __fd_glob_1, "getting-started/meta.json": __fd_glob_2, "reference/meta.json": __fd_glob_3, }, {"index.mdx": __fd_glob_4, "core/architecture.mdx": __fd_glob_5, "core/data-model.mdx": __fd_glob_6, "core/workflows.mdx": __fd_glob_7, "getting-started/installation.mdx": __fd_glob_8, "getting-started/overview.mdx": __fd_glob_9, "reference/api-reference.mdx": __fd_glob_10, "reference/contributing.mdx": __fd_glob_11, "reference/deployment.mdx": __fd_glob_12, });