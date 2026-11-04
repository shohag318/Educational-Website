/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mui/x-date-pickers", "@mui/x-internals"],
  async redirects() {
    return [
      { source: "/sessions", destination: "/session/manager", permanent: false },
      { source: "/sessions/manager", destination: "/session/manager", permanent: false },
      { source: "/sessions/create", destination: "/session/create", permanent: false },
      { source: "/sessions/:path*", destination: "/session/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
