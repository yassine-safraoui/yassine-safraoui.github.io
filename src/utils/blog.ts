import type { CollectionEntry } from "astro:content";

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

export function getBlogSlug(blog: CollectionEntry<"blog">): string {
	const customSlug = slugify(blog.data.properties.Slug);
	if (customSlug.length > 0) {
		return customSlug;
	}

	const titleSlug = slugify(blog.data.properties.Title);
	if (titleSlug.length > 0) {
		return `${titleSlug}-${blog.id.slice(0, 8)}`;
	}

	return blog.id;
}

export function formatBlogDate(date: Date | null | undefined): string | null {
	if (!date) {
		return null;
	}

	return new Intl.DateTimeFormat("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

export function getBlogDisplayDate(blog: CollectionEntry<"blog">): {
	label: "Created" | "Updated";
	value: string;
} | null {
	const updated = blog.data.properties["Last Updated"]?.start;
	if (updated) {
		const formatted = formatBlogDate(updated);
		if (formatted) {
			return { label: "Updated", value: formatted };
		}
	}

	const created = blog.data.properties["Publish Date"]?.start;
	if (created) {
		const formatted = formatBlogDate(created);
		if (formatted) {
			return { label: "Created", value: formatted };
		}
	}

	return null;
}
