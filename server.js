const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/default');

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    console.log(`MongoDB Connected successfully to ${config.mongoURI}`);

    const PORT = config.port || 5000;
    
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${config.env || 'development'} mode on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      }
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error(`Error: ${err.message}`);
      // For Vercel, don't close server, just log error
      console.error(err.stack);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// For Vercel serverless environment
if (process.env.NODE_ENV === 'production') {
  // Just connect to the database
  connectDB().then(() => {
    console.log('MongoDB Connected for serverless environment');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
} else {
  // Start server normally for local development
  startServer();
}

// Export the app for Vercel serverless functions
module.exports = app;