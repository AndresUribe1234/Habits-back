# Habits Back-end

Habits Back-end is the back-end code for a web application that helps users track their habits and provides insights to help them stay motivated. The app is built using Node.js and Express.js frameworks, which are based on JavaScript, and it runs on the back-end. It serves as the back-end for the front-end code which is available at the following URL: https://github.com/AndresUribe1234/Habits-front.

## Motivation

This project is very important to me because I have been tracking my habits for the last 4 years and it has changed my life. By visualizing my progress, I was able to stay motivated and make positive changes in my daily routines. I wanted to create an app that would help others do the same.

## Features

The app has the following features:

- Habit tracking: Users can create habits and track their progress over time.
- Insights: The app provides insights on users' habits, such as streaks, success rates, and most common habits.
- Motivation: The app displays users' progress in a way that helps them stay motivated and continue developing their habits.
- User accounts: Users can create accounts and save their habits and progress.

## Installation

To install the back-end code, follow these steps:

1. Clone the repository: `git clone https://github.com/AndresUribe1234/Habits-back.git`
2. Install dependencies: `npm install`
3. Create a `.env` file based on the `.env.example` file and update the variables with your own information.
4. Run the app: `npm start`

Note: The app requires a front-end code to work properly. Please refer to the [Habits Front-end](https://github.com/AndresUribe1234/Habits-front) repository for more information.

## Usage

To use the API, follow these steps:

1. Make sure that the MongoDB database is running.
2. Set the necessary environment variables in a `config.env` file:

   - `PORT`: The port number where the API should listen for requests.
   - `USERNAME`: The username for the MongoDB database.
   - `PASSWORD`: The password for the MongoDB database.
   - `DATABASE_PASSWORD`: The password for the MongoDB database.
   - `DATABASE_USERNAME`: The username for the MongoDB database.
   - `DATABASE`: The URL for the MongoDB database.
   - `DATABASE_NAME`: The name of the MongoDB database.
   - `JWT_SECRET`: The secret key for JWT authentication.
   - `JWT_EXPIRES_IN`: The time (in seconds) for JWT token to expire.
   - `JWT_COOKIE_EXPIRES_IN`: The time (in seconds) for JWT cookie to expire.
   - `API_KEY_SENDGRID`: The API key for SendGrid email service.

3. Run the API: `npm start`.

## API Routes

### Users

- GET /api/users/ - Get all users
- GET /api/users/profile/:email - Get user profile by email
- POST /api/users/profile/:email - Update user profile by email
- GET /api/users/profile/id/:userId - Get user profile by user ID
- GET /api/users/get-leaderboards - Get leaderboards

### Authentication

- POST /api/signup - Sign up a user
- POST /api/signup/post-token - Create an account post-token
- POST /api/login - Login a user
- POST /api/account/change-email - Change user's email
- POST /api/account/validate-token - Validate email change post-token
- PATCH /api/account/change-password - Change user's password
- POST /api/account/password-reset/send-token - Send email token for password reset
- POST /api/account/password-reset/new-password - Change user's password post-token

### Registrations

- GET /api/registration/single-user/ - Get single user
- POST /api/registration/single-user/ - Create new habit
- GET /api/registration/ - Get all registrations
- GET /api/registration/entry/:id - Get registration by ID
- PATCH /api/registration/entry/:id - Edit registration by ID
- GET /api/registration/single-user/:id - Get all user registrations by user ID
- GET /api/registration/unique-habits - Get unique habits value

## Production Environment

The app is live at https://habits-back-three.vercel.app/ and is running in the production environment.

## License

This project is licensed under the terms of the MIT license. See the [LICENSE](https://github.com/AndresUribe1234/Habits-back/blob/main/license.txt) file for more information.

## Contact

If you have any questions or comments about the app, feel free to contact me at [andres01uribe@gmail.com](mailto:andres01uribe@gmail.com).
