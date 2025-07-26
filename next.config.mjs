// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Tanda '**' mengizinkan SEMUA hostname
      },
      {
        protocol: "http",
        hostname: "**", // Izinkan juga untuk http jika perlu
      },
    ],
  },
};

export default nextConfig;
