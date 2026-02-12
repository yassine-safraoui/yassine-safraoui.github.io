import { defineCollection } from "astro:content";
import { z } from "astro/zod";

export const profile = defineCollection({
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
      content: z.string(),
      email: z.string(),
      github: z.string(),
      linkedin: z.string(),
    }),
  }),
});

export const collections = { profile };
