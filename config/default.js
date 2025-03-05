module.exports = {
  mongoURI: process.env.MONGODB_URI || 'mongodb+srv://muhammedsadhef:RIFA123456@cluster0.7xpiu.mongodb.net/cookify?retryWrites=true&w=majority',
  jwtSecret: process.env.JWT_SECRET || 'cookify_jwt_secret',
  jwtExpiration: process.env.JWT_EXPIRE || '24h',
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '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',
  siteUrl: process.env.SITE_URL || 'https://cookifyy.vercel.app',
  siteName: process.env.SITE_NAME || 'COokiFy'
};