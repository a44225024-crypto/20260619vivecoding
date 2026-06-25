import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack(기본)과 webpack 설정 동시 선언 → 각 빌더가 자신의 설정만 사용
  turbopack: {},
  webpack: (config) => {
    // pdfjs-dist가 서버 사이드에서 canvas를 찾다가 오류 나는 것 방지
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
