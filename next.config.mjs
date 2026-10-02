/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sevilla',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
