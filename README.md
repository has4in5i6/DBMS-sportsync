# SportSync

## 1. Problem Statement

Local and semi-professional sports ecosystems often struggle with coordination between players, coaches, and court owners. Players have trouble finding reliable coaches and available courts, coaches lack visibility, and court infrastructure is underutilized. These gaps create inefficiencies in discovery, scheduling, and coordination.

## 2. Proposed Solution

SportSync is a Sports Matchmaking and Booking Platform that connects players, coaches, and court owners in a unified system for seamless discovery, scheduling, and interaction.

### Players
- Create profiles with sport interests, skill level, and availability
- Discover and book suitable coaches and courts based on preferences
- Form groups for regular play and coordination

### Coaches
- Maintain profiles with experience, ratings, and coaching history
- Define available time slots and manage session bookings
- Provide training sessions and receive feedback from players

### Court Owners
- List courts with details such as location, sport type, and pricing
- Manage availability schedules and handle booking requests
- Monitor court utilization and maintain facility information

## 3. Core Functionalities

- User authentication and profile management
- Search and filtering of coaches and courts
- Booking system with time-slot conflict handling
- Scheduling of coaching sessions and court usage
- Group formation for players
- Rating and review system

## 4. Implementation Plan

- Frontend: React with Vite
- Backend: REST APIs using Node.js and Express
- Database: SQL (PostgreSQL-compatible schema)
- Booking conflict detection: time interval overlap logic
- Role-based access control for players, coaches, and owners

## 5. Repository Structure

```
sportsync/
│
├── backend/              # Node.js API server
├── frontend/             # React Vite app
├── database/             # SQL schema, sample data, and queries
└── README.md
```

### backend/
- `app.js`: main server entrypoint
- `db.js`: database connection
- `routes/`: API route definitions
- `controllers/`: route logic and handlers
- `models/`: SQL query layer
- `middleware/`: authentication and role-based access control
- `utils/`: helper logic such as booking conflict checks

### frontend/
- `src/`: React app source
- `src/pages/`: pages for auth, player, coach, and owner flows
- `src/components/`: reusable UI components
- `src/services/`: API request helpers
- `src/context/`: global auth and state management

### database/
- `DDL.sql`: schema definitions
- `Data.sql`: sample seed data
- `queries.sql`: example SQL queries

## 6. Getting Started

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
3. Configure database connection in `backend/.env`
4. Run the backend server and frontend app separately

## 7. Notes

This template is designed to reflect the SportSync platform goals: matchmaking, booking, and scheduling across players, coaches, and court owners.
