import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryName = "factomedia-group";
const localDevOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((networkInterface): networkInterface is NonNullable<typeof networkInterface> => Boolean(networkInterface))
  .filter((networkInterface) => networkInterface.family === "IPv4" && !networkInterface.internal)
  .map((networkInterface) => networkInterface.address);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? `/${repositoryName}` : "",
  assetPrefix: isGitHubPages ? `/${repositoryName}/` : "",
  allowedDevOrigins: ["127.0.0.1", ...localDevOrigins],
};

export default nextConfig;
