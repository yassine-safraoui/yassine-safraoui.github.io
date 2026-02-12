import type { Client, isFullBlock, isFullPage } from "@notionhq/client";

export type JsonObject = Record<string, unknown>;
export type Asserts<FunctionType> = FunctionType extends (
	input: unknown,
) => input is infer Type
	? Type
	: never;
export type NotionClientOptions = NonNullable<
	ConstructorParameters<typeof Client>[0]
>;
export type QueryDataSourceParameters = Parameters<
	Client["dataSources"]["query"]
>[0];
export type NotionPage = Asserts<typeof isFullPage>;
export type NotionBlock = Asserts<typeof isFullBlock>;

export type PageProperty = NotionPage["properties"][string];
export type EmojiRequest = Extract<
	NotionPage["icon"],
	{ type: "emoji" }
>["emoji"];

export type RichTextItemResponse = Extract<
	PageProperty,
	{ type: "rich_text" }
>["rich_text"][number];

export type NotionPageData = Pick<
	NotionPage,
	| "icon"
	| "cover"
	| "archived"
	| "in_trash"
	| "url"
	| "public_url"
	| "properties"
>;

export type FileObject =
	| { type: "external"; external: { url: string } }
	| { type: "file"; file: { url: string } };
