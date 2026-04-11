# EQueue Frontend

React frontend for the EQueue appointment system.

## Setup

1. Open terminal in `equeue-frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file:
   ```bash
   copy .env.example .env
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

The React app will run on `http://localhost:5173`.

## Backend connection

This frontend uses the backend at `http://localhost:1187` by default.
If your backend is running somewhere else, update `VITE_API_BASE_URL` in `.env`.

## Features

- Live slot availability for selected service and date
- Appointment booking with user details
- List of appointments with cancel/reschedule actions
- Booking status display: Confirmed, Cancelled, Rescheduled
