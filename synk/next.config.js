/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
  },
  images: {
    domains: ["skcdn.tv"]
  }
}

module.exports = nextConfig
