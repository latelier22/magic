/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "cards.scryfall.io",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "svgs.scryfall.io",
          pathname: "/**",
        },
        
      ],
    },
  };
  
  module.exports = nextConfig;
  
