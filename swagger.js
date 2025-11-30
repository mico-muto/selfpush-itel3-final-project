const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Music Playlist CRUD API',
    version: '1.0.0',
    description: 'Swagger documentation for the Music Playlist API',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server.js', "./routes/*.js"],
};

module.exports = swaggerJSDoc(options);