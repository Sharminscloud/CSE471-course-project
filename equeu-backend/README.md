# EQueue Backend

Digital Queue Transparency and Smart Slot Allocation System for Public Services.

## Features Implemented

1. Appointment booking with real-time slot availability checks
2. Slot cancellation that releases the slot and updates status
3. Appointment rescheduling with slot validation
4. Booking status management for Confirmed, Cancelled, and Rescheduled appointments

## Tech Stack

- Node.js + Express.js
- MongoDB Atlas
- Mongoose
- Cors, dotenv, morgan

## API Endpoints

### Health
- `GET /` - basic health check

### Appointments
- `POST /api/appointments`
  - body: `{ serviceType, date, timeSlot, userName, userEmail, userPhone }`
- `GET /api/appointments` - list all appointments
- `GET /api/appointments/:id` - get single appointment
- `PATCH /api/appointments/:id/cancel` - cancel an appointment
- `PATCH /api/appointments/:id/reschedule`
  - body: `{ date, timeSlot }`

### Slots
- `GET /api/slots/availability?serviceType=...&date=YYYY-MM-DD`
  - returns available time slots for the requested service and date

## Setup and Run Instructions

1. Open terminal in `equeue-backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example`:
   ```bash
   copy .env.example .env
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

The API will run on `http://localhost:1188` by default.

## Notes

- The backend listens on port `1188` when `PORT` is set in `.env`.
- Ensure the MongoDB Atlas URI is available in `.env`.
- The `availability` endpoint only returns slots that are not already booked for the same service and date.
- For production deployment, use `npm start` and secure your connection string.
