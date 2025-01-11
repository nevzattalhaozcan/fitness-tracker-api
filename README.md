# Fitness Tracker API Documentation

## Overview
The Fitness Tracker API is designed to help users manage their fitness activities, workouts, and workout plans. It includes features for user authentication, activity logging, workout management, and admin functionalities. This project showcases my skills in building a robust and scalable API using modern web technologies.

## Folder Structure
The project is organized as follows:

```
fitness-tracker-api/
│
├── config/             # Configuration files
│   ├── database.js
│   ├── logger.js
│   └── swaggerConfig.js
│
├── middlewares/         # Custom middleware
│   ├── authMiddleware.js
│   ├── loggerMiddleware.js
│   └── rateLimiter.js
│
├── routes/             # API routes
│   ├── activityRoutes.js
│   ├── adminRoutes.js
│   ├── userRoutes.js
│   ├── workoutPlanRoutes.js
│   └── workoutRoutes.js
│
├── server/             # App entry point
│   └── app.js
│
├── tests/              # Unit tests
│   ├── database/
│   ├── middlewares/ 
│       ├── authMiddleware.test.js
│       └── loggerMiddleware.test.js
│   ├── routes/
│       ├── activityRoutes.test.js
│       ├── adminRoutes.test.js
│       ├── userRoutes.test.js
│       ├── workoutRoutes.test.js
│       └── workoutPlanRoutes.test.js
│   └── utils/
│       └── validations.test.js
│
├── utils/              # Utility functions
│   └── tokenUtils.js
│
├── .env                # Environment variables
├── .gitignore          # Untracked files and folders
├── package.json        # Project dependencies
├── package-lock.json   
└── README.md           # Project documentation
```

## Main Concepts
- **Authentication:** Secure user authentication using JWT tokens.
- **Activity Logging:** Track and log various fitness activities.
- **Workout Management:** Create, update, and manage workout routines.
- **Admin Functionality:** Admin-specific routes for managing users and data.
- **Error Handling:** Consistent error handling across all routes.
- **API Documentation:** Comprehensive API documentation using Swagger.

## Tech Stack and Versions
- **Node.js:** v22.12.0
- **Express:** v4.21.2
- **Postgres:** v8.13.1
- **JWT:** v9.0.2
- **Swagger OAS:** v3.0

## Installation
To install and run this project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitness-tracker-api.git
   cd fitness-tracker-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables (e.g., database connection string, JWT secret).

4. Run the application:
   ```bash
   npm start
   ```

## Usage
Once the application is running, you can access the API documentation using Swagger at the following URL:
- [Swagger Documentation](https://fitness-tracker-api-x3cg.onrender.com/api-docs)

## Contact
For any questions or issues, please contact me at:
- **Email:** onevzattalha@gmail.com
- **LinkedIn:** [Nevzat Talha Özcan](https://www.linkedin.com/in/nevzattalhaozcan)
