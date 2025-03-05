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
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();