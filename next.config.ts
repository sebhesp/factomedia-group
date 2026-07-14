import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const repositoryName = "factomedia-group";
const isVercel = process.env.VERCEL === "1";
const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages" || (process.env.GITHUB_ACTIONS === "true" && !isVercel);
const localDevOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((networkInterface): networkInterface is NonNullable<typeof networkInterface> => Boolean(networkInterface))
  .filter((networkInterface) => networkInterface.family === "IPv4" && !networkInterface.internal)
  .map((networkInterface) => networkInterface.address);

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: "export" as const } : {}),
  trailingSlash: isGitHubPages,
  images: { unoptimized: isGitHubPages },
  basePath: isGitHubPages ? `/${repositoryName}` : "",
  assetPrefix: isGitHubPages ? `/${repositoryName}/` : "",
  allowedDevOrigins: ["127.0.0.1", ...localDevOrigins],
};

export default nextConfig;
