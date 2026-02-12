import {
	Client,
	isFullBlock,
	isFullPage,
	iteratePaginatedAPI,
} from "@notionhq/client";
import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import notionRehype from "notion-rehype-k";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type {
	JsonObject,
	NotionBlock,
	NotionClientOptions,
	NotionPage,
	QueryDataSourceParameters,
} from "./types";

const DEFAULT_BASE_URL = "https://api.notion.com";
const DEFAULT_NOTION_VERSION = "2025-09-03";
const DEFAULT_PAGE_SIZE = 100;
const CHECKPOINT_META_KEY = "notion:lastEditedCheckpoint";
const FILTER_FINGERPRINT_META_KEY = "notion:queryFingerprint";

export interface NotionLoaderOptions {
	/**
	 * Notion integration token.
	 */
	auth: NonNullable<NotionClientOptions["auth"]>;
	/**
	 * ID of the data source to load from.
	 */
	data_source_id: string;
	/**
	 * Optional query filters to reduce property payload size.
	 */
	filter_properties?: QueryDataSourceParameters["filter_properties"];
	/**
	 * Notion query sorts.
	 */
	sorts?: QueryDataSourceParameters["sorts"];
	/**
	 * Notion query filter.
	 */
	filter?: QueryDataSourceParameters["filter"];
	/**
	 * Include archived pages in query.
	 */
	archived?: QueryDataSourceParameters["archived"];
	/**
	 * Include pages in trash in query.
	 */
	in_trash?: QueryDataSourceParameters["in_trash"];
	/**
	 * Notion API page size (max 100).
	 */
	page_size?: number;
	/**
	 * Name used in Astro logs to identify this loader.
	 */
	collectionName?: string;
	/**
	 * Notion API base URL.
	 */
	baseUrl?: NotionClientOptions["baseUrl"];
	/**
	 * Notion API version header.
	 */
	notionVersion?: NotionClientOptions["notionVersion"];
	/**
	 * Custom fetch implementation.
	 */
	fetch?: NotionClientOptions["fetch"];
	/**
	 * Request timeout in milliseconds.
	 */
	timeoutMs?: NotionClientOptions["timeoutMs"];
	/**
	 * Optional custom HTTP agent for Node runtimes.
	 */
	agent?: NotionClientOptions["agent"];
	/**
	 * Optional Notion SDK log level.
	 */
	logLevel?: NotionClientOptions["logLevel"];
	/**
	 * Optional Notion SDK logger.
	 */
	logger?: NotionClientOptions["logger"];
}

const notionPageDataSchema = z.object({
	icon: z.unknown().nullable(),
	cover: z.unknown().nullable(),
	created_time: z.string(),
	last_edited_time: z.string(),
	archived: z.boolean(),
	in_trash: z.boolean(),
	url: z.string().url(),
	public_url: z.string().url().nullable(),
	properties: z.object({}).catchall(z.unknown()),
});

function isRecord(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null;
}

function toCompactText(input: unknown): string {
	if (typeof input === "string") {
		return input;
	}

	try {
		return JSON.stringify(input);
	} catch {
		return String(input);
	}
}

function maxIsoDate(
	a: string | undefined,
	b: string | undefined,
): string | undefined {
	if (!a) {
		return b;
	}

	if (!b) {
		return a;
	}

	return a > b ? a : b;
}

function buildQueryFilter(
	baseFilter: QueryDataSourceParameters["filter"] | undefined,
	checkpoint: string | undefined,
): QueryDataSourceParameters["filter"] | undefined {
	if (!checkpoint) {
		return baseFilter;
	}

	const syncFilter: QueryDataSourceParameters["filter"] = {
		timestamp: "last_edited_time",
		last_edited_time: {
			on_or_after: checkpoint,
		},
	};

	if (!baseFilter) {
		return syncFilter;
	}

	return {
		and: [baseFilter, syncFilter],
	} as QueryDataSourceParameters["filter"];
}

function getLatestStoredDigest(
	storeValues: Array<{ digest?: string | number }>,
): string | undefined {
	let latest: string | undefined;
	for (const entry of storeValues) {
		if (typeof entry.digest === "string") {
			latest = maxIsoDate(latest, entry.digest);
		}
	}
	return latest;
}

async function* queryPages({
	dataSourceId,
	pageSize,
	filterProperties,
	sorts,
	filter,
	archived,
	inTrash,
	client,
}: {
	dataSourceId: string;
	pageSize: number;
	filterProperties: QueryDataSourceParameters["filter_properties"] | undefined;
	sorts: QueryDataSourceParameters["sorts"] | undefined;
	filter: QueryDataSourceParameters["filter"] | undefined;
	archived: QueryDataSourceParameters["archived"] | undefined;
	inTrash: QueryDataSourceParameters["in_trash"] | undefined;
	client: Client;
}) {
	const query: QueryDataSourceParameters = {
		data_source_id: dataSourceId,
		page_size: pageSize,
	};

	if (filterProperties) {
		query.filter_properties = filterProperties;
	}
	if (sorts) {
		query.sorts = sorts;
	}
	if (filter) {
		query.filter = filter;
	}
	if (archived !== undefined) {
		query.archived = archived;
	}
	if (inTrash !== undefined) {
		query.in_trash = inTrash;
	}

	for await (const result of iteratePaginatedAPI(
		client.dataSources.query,
		query,
	)) {
		if (isFullPage(result)) {
			yield result;
		}
	}
}

async function fetchBlockChildren(
	blockId: string,
	client: Client,
): Promise<NotionBlock[]> {
	const blocks: NotionBlock[] = [];

	for await (const value of iteratePaginatedAPI(client.blocks.children.list, {
		block_id: blockId,
		page_size: DEFAULT_PAGE_SIZE,
	})) {
		if (!isFullBlock(value)) {
			continue;
		}

		if (value.type === "image") {
			continue;
		}

		if (value.has_children) {
			const children = await fetchBlockChildren(value.id, client);
			const blockPayload = (value as unknown as Record<string, unknown>)[
				value.type
			];
			if (isRecord(blockPayload)) {
				blockPayload.children = children;
			}
		}

		blocks.push(value);
	}

	return blocks;
}

async function renderNotionBlocks(blocks: NotionBlock[]): Promise<string> {
	const processor = unified().use(notionRehype, {}).use(rehypeStringify);
	const rendered = await processor.process({ data: blocks } as Record<
		string,
		unknown
	>);
	return rendered.toString();
}

function pageToData(page: NotionPage) {
	return {
		icon: page.icon,
		cover: page.cover,
		created_time: page.created_time,
		last_edited_time: page.last_edited_time,
		archived: page.archived,
		in_trash: page.in_trash,
		url: page.url,
		public_url: page.public_url,
		properties: page.properties,
	};
}

export function notionLoader({
	auth,
	data_source_id,
	filter_properties,
	sorts,
	filter,
	archived,
	in_trash,
	page_size = DEFAULT_PAGE_SIZE,
	collectionName,
	notionVersion = DEFAULT_NOTION_VERSION,
	...clientOptions
}: NotionLoaderOptions): Loader {
	const client = new Client({
		...clientOptions,
		auth,
		notionVersion,
		baseUrl: clientOptions.baseUrl ?? DEFAULT_BASE_URL,
	});

	const normalizedPageSize = Math.max(
		1,
		Math.min(DEFAULT_PAGE_SIZE, page_size),
	);
	const queryFingerprint = JSON.stringify({
		data_source_id,
		filter_properties: filter_properties ?? null,
		sorts: sorts ?? null,
		filter: filter ?? null,
		archived: archived ?? null,
		in_trash: in_trash ?? null,
		page_size: normalizedPageSize,
	});

	return {
		name: collectionName ? `notion-loader/${collectionName}` : "notion-loader",
		schema: notionPageDataSchema,
		async load({ store, meta, parseData, logger, generateDigest }) {
			const storedFingerprint = meta.get(FILTER_FINGERPRINT_META_KEY);
			const previousCheckpointFromMeta = meta.get(CHECKPOINT_META_KEY);
			const previousCheckpoint =
				typeof previousCheckpointFromMeta === "string"
					? previousCheckpointFromMeta
					: getLatestStoredDigest(store.values());

			const isFullSync =
				storedFingerprint !== queryFingerprint || !previousCheckpoint;
			const checkpoint = isFullSync ? undefined : previousCheckpoint;
			const effectiveFilter = buildQueryFilter(filter, checkpoint);
			const existingIds = new Set(store.keys());

			logger.info(
				`${isFullSync ? "Full sync" : "Incremental sync"} for ${data_source_id} ${checkpoint ? `(since ${checkpoint})` : ""}`,
			);

			let fetchedCount = 0;
			let upsertedCount = 0;
			let deletedCount = 0;
			let latestEditedTime = checkpoint;

			for await (const page of queryPages({
				dataSourceId: data_source_id,
				pageSize: normalizedPageSize,
				filterProperties: filter_properties,
				sorts,
				filter: effectiveFilter,
				archived,
				inTrash: in_trash,
				client,
			})) {
				fetchedCount += 1;
				existingIds.delete(page.id);
				latestEditedTime = maxIsoDate(latestEditedTime, page.last_edited_time);

				const existingEntry = store.get(page.id);
				if (existingEntry?.digest === page.last_edited_time) {
					continue;
				}

				const blocks = await fetchBlockChildren(page.id, client);
				const html = await renderNotionBlocks(blocks);
				const data = await parseData({
					id: page.id,
					data: pageToData(page),
				});

				store.set({
					id: page.id,
					data,
					digest: page.last_edited_time || generateDigest(data),
					rendered: {
						html,
					},
				});

				upsertedCount += 1;
			}

			if (isFullSync) {
				for (const id of existingIds) {
					store.delete(id);
					deletedCount += 1;
				}
			}

			if (latestEditedTime) {
				meta.set(CHECKPOINT_META_KEY, latestEditedTime);
			}
			meta.set(FILTER_FINGERPRINT_META_KEY, queryFingerprint);

			logger.info(
				`Sync complete: fetched=${fetchedCount}, upserted=${upsertedCount}, deleted=${deletedCount}, checkpoint=${toCompactText(latestEditedTime ?? "none")}`,
			);
		},
	};
}
