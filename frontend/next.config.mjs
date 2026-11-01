/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the LAN host used by phones/tablets to request Next dev assets and HMR.
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    ...Array.from({ length: 16 }, (_, index) => `172.${index + 16}.*.*`),
    "*.local",
  ],
  async rewrites() {
    const backendUrl = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
