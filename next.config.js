/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/caie-graduates',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig