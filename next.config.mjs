/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5000',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '5000',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'backend-store-apple.vercel.app',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'be-apple-store.eka-dev.cloud',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.eka-dev.cloud',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'appleid.apple.com',
                pathname: '/**',
            },
        ]
    }
};

export default nextConfig;