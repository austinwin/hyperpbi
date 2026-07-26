import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repositoryRoot,
  outputFileTracingIncludes: {
    "/docs/*": ["../../docs/**/*.md"],
    "/examples/*": ["../../examples/dashboards/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/hyperpbi-component-catalog-reference.html",
        destination: "/components",
        permanent: true,
      },
      {
        source: "/components/map",
        destination: "/examples/maps",
        permanent: true,
      },
      {
        source: "/project/:path*",
        destination: "/playground/project/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
