# Fitness Tracker API Documentation

## Overview
This API allows users to manage their fitness activities, workouts, and workout plans. It includes routes for user authentication, activity logging, workout management, and admin functionalities.

## Authentication Routes

### Register a new user
- **URL:** `/api/users/register`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "name": "string", // required
    "email": "string", // required
    "password": "string", // required
    "height": "number", // required
    "weight": "number" // required
  }
  ```
- **Responses:**
  - `201 Created`
    ```json
    {
      "message": "User registered",
      "userId": "number"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Login user and generate a token
- **URL:** `/api/users/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "string", // required
    "password": "string" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "accessToken": "string",
      "userRole": "string"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid email or password"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Create new access token with refresh token
- **URL:** `/api/users/refresh-token`
- **Method:** `POST`
- **Responses:**
  - `200 OK`
    ```json
    {
      "accessToken": "string"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Invalid refresh token"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Get user details
- **URL:** `/api/users/me`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    {
      "id": "number",
      "name": "string",
      "email": "string",
      "height": "number",
      "weight": "number",
      "isAdmin": "boolean"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Get user stats
- **URL:** `/api/users/stats`
- **Method:** `GET`
- **Query Parameters:** `timeframe` (optional: `daily`, `weekly`, `monthly`)
- **Responses:**
  - `200 OK`
    ```json
    {
      "total_calories": "number",
      "avg_duration": "number",
      "timeframe": "string"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid timeframe"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update user details
- **URL:** `/api/users/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string", // required
    "height": "number", // required
    "weight": "number" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "id": "number",
      "name": "string",
      "email": "string",
      "height": "number",
      "weight": "number"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update email
- **URL:** `/api/users/email`
- **Method:** `PATCH`
- **Body:**
  ```json
  {
    "email": "string" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "id": "number",
      "email": "string"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid email"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update password
- **URL:** `/api/users/password`
- **Method:** `PATCH`
- **Body:**
  ```json
  {
    "password": "string" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Password updated successfully"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid password"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Delete user
- **URL:** `/api/users/:id`
- **Method:** `DELETE`
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "User deleted successfully"
    }
    ```
  - `401 Unauthorized`
    ```json
    {
      "error": "Unauthorized"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

## Workout Routes

### Get all workouts
- **URL:** `/api/workouts`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "muscle": "string",
        "sets": "number",
        "repeats": "number",
        "calories_burned": "number",
        "met_value": "number"
      }
    ]
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Get a specific workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    {
      "id": "number",
      "name": "string",
      "muscle": "string",
      "sets": "number",
      "repeats": "number",
      "calories_burned": "number",
      "met_value": "number"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Workout not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Add a new workout
- **URL:** `/api/workouts`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "name": "string", // required
    "muscle": "string", // required
    "sets": "number", // required
    "repeats": "number", // required
    "calories_burned": "number" // required
  }
  ```
- **Responses:**
  - `201 Created`
    ```json
    {
      "message": "Workout added!",
      "workoutId": "number"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update an existing workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string", // required
    "muscle": "string", // required
    "sets": "number", // required
    "repeats": "number", // required
    "calories_burned": "number" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Workout updated successfully"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Workout not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Delete a workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `DELETE`
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Workout deleted successfully"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Workout not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

## Workout Plan Routes

### Add a Workout to a Plan
- **URL:** `/api/workout-plans/add`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "planname": "string", // required
    "workout_ids": ["number"] // required
  }
  ```
- **Responses:**
  - `201 Created`
    ```json
    {
      "message": "Workouts added to plan successfully."
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Fetch All Plans for a User with Workouts
- **URL:** `/api/workout-plans`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    [
      {
        "planname": "string",
        "workouts": [
          {
            "id": "number",
            "name": "string",
            "muscle": "string",
            "sets": "number",
            "repeats": "number",
            "calories_burned": "number",
            "created_by": "string"
          }
        ]
      }
    ]
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Fetch Workouts in a Specific Plan
- **URL:** `/api/workout-plans/:planname`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "muscle": "string",
        "sets": "number",
        "repeats": "number",
        "calories_burned": "number"
      }
    ]
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Plan not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Delete an entire plan by planname
- **URL:** `/api/workout-plans/:planname`
- **Method:** `DELETE`
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Plan deleted successfully"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Plan not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update a plan by planname
- **URL:** `/api/workout-plans/:planname`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "planname": "string", // required
    "new_planname": "string", // required
    "workout_ids": ["number"] // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Plan updated successfully."
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Plan not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

## Activity Routes

### Get all activities
- **URL:** `/api/activities`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "duration": "number",
        "date": "string",
        "calories_burned": "number"
      }
    ]
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Get a specific activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    {
      "id": "number",
      "name": "string",
      "duration": "number",
      "date": "string",
      "calories_burned": "number"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Activity not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Log new activities (batch insert)
- **URL:** `/api/activities`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "activities": [
      {
        "name": "string", // required
        "duration": "number", // required
        "date": "string", // required
        "calories_burned": "number" // required
      }
    ]
  }
  ```
- **Responses:**
  - `201 Created`
    ```json
    {
      "message": "Activities logged successfully!"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Update an existing activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string", // required
    "duration": "number", // required
    "date": "string", // required
    "calories_burned": "number" // required
  }
  ```
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Activity updated successfully!"
    }
    ```
  - `400 Bad Request`
    ```json
    {
      "error": "Invalid input data"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Activity not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

### Delete an activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `DELETE`
- **Responses:**
  - `200 OK`
    ```json
    {
      "message": "Activity deleted successfully"
    }
    ```
  - `404 Not Found`
    ```json
    {
      "error": "Activity not found"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

## Admin Routes

### Get all users (restricted to admin users)
- **URL:** `/api/admin`
- **Method:** `GET`
- **Responses:**
  - `200 OK`
    ```json
    [
      {
        "id": "number",
        "name": "string",
        "email": "string",
        "height": "number",
        "weight": "number"
      }
    ]
    ```
  - `403 Forbidden`
    ```json
    {
      "error": "Access denied"
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "error": "Server error"
    }
    ```

## Error Handling
All routes will return appropriate HTTP status codes and error messages in case of failures.

## Authentication
Most routes require a valid JWT token for authentication. Ensure to include the token in the `Authorization` header as `Bearer <token>`.

## Contact
For any questions or issues, please contact me.
