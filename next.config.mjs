/** @type {import("next").NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Evita que Next infiera el workspace root cuando hay múltiples lockfiles.
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ["unexperiential-nontuned-eliana.ngrok-free.dev"],
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: ""
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: ""
      },
      {
        protocol: "https",
        hostname: "assets-zelify.s3.us-east-1.amazonaws.com",
        port: ""
      }
    ]
  }
};

export default nextConfig;
