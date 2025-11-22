const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Massage Reservation API',
      version: '1.0.0',
      description: 'API documentation for Massage Reservation System',
    },
    servers: [
      {
        url: 'http://localhost:5003/api/v1',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Route files
const massageShops = require('./routes/massageshops');
const auth = require('./routes/auth');
const appointments = require('./routes/appointments');

// Initialize app
const app = express();

// Enable CORS
app.use(cors());

// Cookie parser
app.use(cookieParser());

// Body parser (ต้องมาก่อน sanitize)
app.use(express.json());

// Sanitize data (ป้องกัน NoSQL Injection)
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Swagger docs route
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 500, // จำกัดไม่เกิน 100 requests ต่อ 10 นาที
});
app.use(limiter);

// Prevent HTTP param pollution
app.use(hpp());

// Mount routers
app.use('/api/v1/massageshops', massageShops);
app.use('/api/v1/auth', auth);
app.use('/api/v1/appointments', appointments);

// Server start
const PORT = process.env.PORT || 5003;
const server = app.listen(
  PORT,
  () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
