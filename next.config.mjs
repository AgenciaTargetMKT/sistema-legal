/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
