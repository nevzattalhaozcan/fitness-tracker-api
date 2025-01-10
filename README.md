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
    "name": "string",
    "email": "string",
    "password": "string",
    "height": "number",
    "weight": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered",
    "userId": "number"
  }
  ```

### Login user and generate a token
- **URL:** `/api/users/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "string",
    "userRole": "string"
  }
  ```

### Create new access token with refresh token
- **URL:** `/api/users/refresh-token`
- **Method:** `POST`
- **Response:**
  ```json
  {
    "accessToken": "string"
  }
  ```

### Get user details
- **URL:** `/api/users/me`
- **Method:** `GET`
- **Response:**
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

### Get user stats
- **URL:** `/api/users/stats`
- **Method:** `GET`
- **Query Parameters:** `timeframe` (optional: `daily`, `weekly`, `monthly`)
- **Response:**
  ```json
  {
    "total_calories": "number",
    "avg_duration": "number",
    "timeframe": "string"
  }
  ```

### Update user details
- **URL:** `/api/users/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string",
    "height": "number",
    "weight": "number"
  }
  ```
- **Response:**
  ```json
  {
    "id": "number",
    "name": "string",
    "email": "string",
    "height": "number",
    "weight": "number"
  }
  ```

### Update email
- **URL:** `/api/users/email`
- **Method:** `PATCH`
- **Body:**
  ```json
  {
    "email": "string"
  }
  ```
- **Response:**
  ```json
  {
    "id": "number",
    "email": "string"
  }
  ```

### Update password
- **URL:** `/api/users/password`
- **Method:** `PATCH`
- **Body:**
  ```json
  {
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

### Delete user
- **URL:** `/api/users/:id`
- **Method:** `DELETE`
- **Response:**
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

## Workout Routes

### Get all workouts
- **URL:** `/api/workouts`
- **Method:** `GET`
- **Response:**
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

### Get a specific workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `GET`
- **Response:**
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

### Add a new workout
- **URL:** `/api/workouts`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "name": "string",
    "muscle": "string",
    "sets": "number",
    "repeats": "number",
    "calories_burned": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Workout added!",
    "workoutId": "number"
  }
  ```

### Update an existing workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string",
    "muscle": "string",
    "sets": "number",
    "repeats": "number",
    "calories_burned": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Workout updated successfully"
  }
  ```

### Delete a workout by ID
- **URL:** `/api/workouts/:id`
- **Method:** `DELETE`
- **Response:**
  ```json
  {
    "message": "Workout deleted successfully"
  }
  ```

## Workout Plan Routes

### Add a Workout to a Plan
- **URL:** `/api/workout-plans/add`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "planname": "string",
    "workout_ids": ["number"]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Workouts added to plan successfully."
  }
  ```

### Fetch All Plans for a User with Workouts
- **URL:** `/api/workout-plans`
- **Method:** `GET`
- **Response:**
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

### Fetch Workouts in a Specific Plan
- **URL:** `/api/workout-plans/:planname`
- **Method:** `GET`
- **Response:**
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

### Delete an entire plan by planname
- **URL:** `/api/workout-plans/:planname`
- **Method:** `DELETE`
- **Response:**
  ```json
  {
    "message": "Plan deleted successfully"
  }
  ```

### Update a plan by planname
- **URL:** `/api/workout-plans/:planname`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "planname": "string",
    "new_planname": "string",
    "workout_ids": ["number"]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Plan updated successfully."
  }
  ```

## Activity Routes

### Get all activities
- **URL:** `/api/activities`
- **Method:** `GET`
- **Response:**
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

### Get a specific activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": "number",
    "name": "string",
    "duration": "number",
    "date": "string",
    "calories_burned": "number"
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
        "name": "string",
        "duration": "number",
        "date": "string",
        "calories_burned": "number"
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Activities logged successfully!"
  }
  ```

### Update an existing activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `PUT`
- **Body:**
  ```json
  {
    "name": "string",
    "duration": "number",
    "date": "string",
    "calories_burned": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Activity updated successfully!"
  }
  ```

### Delete an activity by ID
- **URL:** `/api/activities/:id`
- **Method:** `DELETE`
- **Response:**
  ```json
  {
    "message": "Activity deleted successfully"
  }
  ```

## Admin Routes

### Get all users (restricted to admin users)
- **URL:** `/api/admin`
- **Method:** `GET`
- **Response:**
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

## Error Handling
All routes will return appropriate HTTP status codes and error messages in case of failures.

## Authentication
Most routes require a valid JWT token for authentication. Ensure to include the token in the `Authorization` header as `Bearer <token>`.

## Contact
For any questions or issues, please contact me.
