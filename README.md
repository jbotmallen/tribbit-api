# Project Setup

## Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x)

## Installation

1. **Clone the repository:**

    ```sh
    git clone https://github.com/jbotmallen/habit-tracker-api
    cd habit-tracker-api
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file in the root directory and add the necessary environment variables. Refer to `.env.example` if available.

    ```sh
    cp .env.example .env
    ```
    To create a MongoDB database, follow the steps for the setup in the official <a href="https://www.mongodb.com/resources/products/fundamentals/get-started" target="_blank">MongoDB Documentation</a>.

    To get your SendGrid API key, follow the steps in setting up a <a href="https://www.twilio.com/docs/sendgrid/for-developers/sending-email/quickstart-nodejs" target="_blank">SendGrid Account</a>.

4. **Configure TypeScript:**

    Ensure `tsconfig.json` is properly configured. The provided `tsconfig.json` should be sufficient for most setups.

## Running the Project

1. **Build the project:**

    ```sh
    npm run build
    ```

2. **Start the development server:**

    ```sh
    npm run dev
    ```

    This will start the server with hot-reloading enabled.

3. **Start the production server:**

    ```sh
    npm start
    ```

4. **Run the tests**

    ```
    npm t
    ```

<hr/>

#

## Project Structure

- **controllers/**: Contains the controller files for handling requests.
- **middlewares/**: Contains middleware functions for request processing.
- **models/**: Contains the data models.
- **routes/**: Contains route definitions.
- **types/**: Contains TypeScript type definitions.
- **utils/**: Contains utility functions and constants.

## Available Scripts

- `npm run build`: Compiles the TypeScript code.
- `npm run dev`: Starts the development server.
- `npm start`: Starts the production server.

## Routes

### Auth Routes

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/auth/logout`: Logout a user
- `GET /api/auth/me`: Get current logged-in user

### Habits Routes

- `GET /api/habits`: Fetch all habits
- `POST /api/habits`: Create a new habit
- `GET /api/habits/:id`: Fetch a specific habit by ID
- `PUT /api/habits/:id`: Update a specific habit by ID
- `DELETE /api/habits/:id`: Delete a specific habit by ID

## Deployed Vercel Server

-https://habit-tracker-api-rho.vercel.app/api/

## License

This project is licensed under the MIT License.