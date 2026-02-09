import { getEntry } from "astro:content";
const entry = await getEntry("profile", "main");
if (entry == undefined) {
  console.error("Couldn't read profile");
  throw new Error("Couldn't read profile. Panicing...");
}

const profile = entry!.data;
export default profile;
