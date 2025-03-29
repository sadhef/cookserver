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
