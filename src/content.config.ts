import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { notionLoader } from "./notion/loader";
import {
	date,
	multi_select,
	rich_text,
	select,
	title,
} from "./notion/transformed-properties";
import "dotenv/config";

const profile = defineCollection({
	type: "data",
	schema: z.object({
		title: z.string(),
		description: z.string(),
		about: z.string(),
		hero_description: z.string(),
		experience: z.object({
			title: z.string(),
			items: z.array(
				z.object({
					job: z.string(),
					company: z.string(),
					companyUrl: z.string(),
					date: z.string(),
					info: z.object({
						enable: z.boolean(),
						content: z.string(),
					}),
					badges: z.array(z.object({ name: z.string() })),
					content: z.string(),
				}),
			),
		}),
		education: z.object({
			items: z.array(
				z.object({
					title: z.string(),
					school: z.object({
						name: z.string(),
						url: z.string().optional(),
					}),
					date: z.string(),
					content: z.string(),
				}),
			),
		}),
		skills: z.object({
			title: z.string(),
			categories: z.object({
				index: z.boolean(),
				items: z.array(
					z.object({
						title: z.string(),
						skills: z.object({
							index: z.boolean(),
							items: z.array(
								z.object({
									name: z.string(),
									proficiency: z.number(),
									learnedFrom: z.object({
										index: z.boolean(),
										items: z.array(
											z.object({
												name: z.string(),
												type: z.string().optional(),
											}),
										),
									}),
								}),
							),
						}),
					}),
				),
			}),
		}),
		projects: z.object({
			items: z.array(
				z.object({
					title: z.string(),
					content: z.string(),
					badges: z.array(
						z.object({
							name: z.string(),
							primary: z.boolean().default(false),
						}),
					),
					links: z
						.array(
							z.object({
								icon: z.string(),
								url: z.string(),
							}),
						)
						.optional(),
				}),
			),
		}),
		contact: z.object({
			email: z.string(),
			github: z.string(),
			linkedin: z.string(),
		}),
	}),
});

const blog = defineCollection({
	type: "content_layer",
	loader: notionLoader({
		auth: import.meta.env.NOTION_API_TOKEN,
		data_source_id: import.meta.env.NOTION_DATASOURCE_ID,
		filter: {
			property: "Status",
			status: {
				equals: "Published",
			},
		},
	}),
	schema: z.object({
		properties: z.object({
			Title: title,
			Category: select,
			"Last Updated": date,
			"Publish Date": date,
			Tags: multi_select,
			Slug: rich_text,
			"Content Brief": rich_text,
		}),
	}),
});

export const collections = { profile, blog };
