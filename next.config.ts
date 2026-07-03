import type { NextConfig } from "next";

// When building for GitHub Pages the site is served from a subpath
// (https://<user>.github.io/<repo>/), so assets must be prefixed. Local
// `bun run dev` and `bun run build` leave GITHUB_PAGES unset and serve at root.
const repo = "3D-Dice-Roller";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export", // static HTML/JS export — GitHub Pages has no server
  basePath: isGithubPages ? `/${repo}` : "",
  assetPrefix: isGithubPages ? `/${repo}/` : "",
  images: { unoptimized: true }, // no image optimizer on static hosting
};

export default nextConfig;
