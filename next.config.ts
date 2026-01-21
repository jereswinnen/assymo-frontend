import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assymo-frontend.vercel.app",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/producten/eiken-bijgebouwen",
        destination: "/realisaties/bijgebouwen",
        permanent: true,
      },
      {
        source: "/buitenschrijnwerk/terrassen.html",
        destination: "/realisaties/bijgebouwen",
        permanent: true,
      },
      {
        source: "/tuinconstructies/tuinhuizen.html",
        destination: "/realisaties/tuinhuizen-op-maat",
        permanent: true,
      },
      {
        source: "/buitenschrijnwerk/terrassen.html",
        destination: "/realisaties",
        permanent: true,
      },
      {
        source: "/afspraak.html",
        destination: "/afspraak",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
