# SportSync

SportSync is a full-stack sports matchmaking and booking platform built from your project outline using:

- `Node.js + Express` for the backend API
- `React + Vite` for the frontend
- `PostgreSQL` for the database

It supports the core features from the PDF:

- user authentication and role-based access
- player, coach, and owner profile management
- coach and court search with filters
- booking with time conflict detection
- weekly availability schedules for coaches and courts
- player group creation and joining
- ratings and reviews
- owner court management and booking visibility

## Project Structure

```text
dbms-sportsync/
├── backend/
├── frontend/
├── database/
│   ├── DDL.sql
│   ├── Data.sql
│   └── queries.sql
└── README.md
```

## Database Setup

You said your PostgreSQL database is already created as `sportsync` and your PostgreSQL username is `anusri`.

Run these commands:

```bash
psql -U anusri -d sportsync -f database/DDL.sql
psql -U anusri -d sportsync -f database/Data.sql
```

If PostgreSQL asks for a password, enter your PostgreSQL password. If your user has no password, just press Enter.

### Seed Login Accounts

Use these sample accounts after importing `Data.sql`:

```text
Player:
username: ananya_player
password: player123

Player:
username: rahul_player
password: player123

Coach:
username: coach_meera
password: coach123

Coach:
username: coach_arjun
password: coach123

Owner:
username: owner_sneha
password: owner123

Owner:
username: owner_karthik
password: owner123
```

## Backend Setup

Move into the backend folder and install dependencies:

```bash
cd backend
npm install
```

The backend `.env` is already configured for your local setup:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=anusri
DB_PASSWORD=
DB_NAME=sportsync
PORT=4000
CLIENT_URL=http://localhost:5173
SESSION_SECRET=sportsync_dev_secret
```

If your PostgreSQL user has a password, update `DB_PASSWORD` in [backend/.env](/home/anusri/Desktop/dbms-sportsync/backend/.env).

Start the backend:

```bash
npm start
```

Backend runs at `http://localhost:4000`.

## Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Main Roles and Features

### Players

- search coaches and courts
- create bookings with conflict checking
- view and cancel their bookings
- update their profile
- create and join groups
- submit reviews for courts and coaches

### Coaches

- maintain coach profile information
- add weekly availability slots
- view booked coaching sessions
- see player reviews

### Court Owners

- create and edit courts
- add court availability
- view bookings made on their courts

## Important Files

- Database schema: [database/DDL.sql](/home/anusri/Desktop/dbms-sportsync/database/DDL.sql)
- Seed data: [database/Data.sql](/home/anusri/Desktop/dbms-sportsync/database/Data.sql)
- Sample SQL queries: [database/queries.sql](/home/anusri/Desktop/dbms-sportsync/database/queries.sql)
- Backend entry: [backend/app.js](/home/anusri/Desktop/dbms-sportsync/backend/app.js)
- Frontend entry: [frontend/src/App.jsx](/home/anusri/Desktop/dbms-sportsync/frontend/src/App.jsx)

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Users

- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/me/overview`

### Courts

- `GET /api/courts`
- `GET /api/courts/:courtId`
- `GET /api/courts/owner/mine`
- `POST /api/courts`
- `PUT /api/courts/:courtId`
- `POST /api/courts/:courtId/availability`

### Coaches

- `GET /api/coaches`
- `GET /api/coaches/:coachId`
- `GET /api/coaches/me/dashboard`
- `POST /api/coaches/me/availability`

### Bookings

- `GET /api/bookings/mine`
- `GET /api/bookings/owner`
- `GET /api/bookings/coach`
- `POST /api/bookings`
- `PATCH /api/bookings/:bookingId/cancel`

### Groups

- `GET /api/groups`
- `GET /api/groups/mine`
- `POST /api/groups`
- `POST /api/groups/:groupId/join`

### Reviews

- `GET /api/reviews`
- `POST /api/reviews`

## Booking Conflict Logic

The booking logic checks:

- overlapping court bookings
- overlapping coach bookings
- overlapping player bookings
- whether the requested time fits inside the court's weekly availability
- whether the requested time fits inside the coach's weekly availability if a coach is selected

This logic is implemented in [backend/controllers/bookingController.js](/home/anusri/Desktop/dbms-sportsync/backend/controllers/bookingController.js) and [backend/utils/timeUtils.js](/home/anusri/Desktop/dbms-sportsync/backend/utils/timeUtils.js).

## How To Run Everything

From the project root:

1. Load the schema into `sportsync`.
2. Seed the database.
3. Start backend from `backend/`.
4. Start frontend from `frontend/`.
5. Open `http://localhost:5173`.

## Notes

- The project is designed as a strong DBMS mini-project / course-project baseline.
- I have not run `npm install` or a full build inside this environment yet, so install and run locally on your machine after importing the SQL.
