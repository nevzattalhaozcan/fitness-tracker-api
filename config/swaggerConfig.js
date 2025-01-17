const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Fitness Tracker application',
    },
    servers: [
      {
        url: 'https://fitness-tracker-api-x3cg.onrender.com',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Corrected path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
