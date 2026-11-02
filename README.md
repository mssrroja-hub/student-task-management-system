# Student Task Management System

A full-stack task manager designed to help students organize assignments, study sessions, projects, and deadlines.

## Features

- Create, edit, delete, and complete tasks
- Add a due date, priority, category, and notes
- Filter tasks by All, Pending, and Completed
- Search tasks by title or description
- Dashboard counts for total, pending, and completed tasks
- Responsive layout for laptop and mobile screens
- MongoDB persistence through a REST API
- Helpful demo mode: if the API is unavailable, the client uses browser local storage

## Tech stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- API: REST (GET, POST, PUT, PATCH, DELETE)

## Requirements

- Node.js 18 or later
- npm
- MongoDB local instance or a MongoDB Atlas connection string

## Setup

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm run install:all
   ```

4. Create `server/.env` by copying `server/.env.example`.
5. Add your MongoDB connection string to `MONGODB_URI`.
6. Start the development servers:

   ```bash
   npm run dev
   ```

7. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

The API runs on `http://localhost:5000`.

## Environment variables

`server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/student_task_manager
CLIENT_ORIGIN=http://localhost:5173
```

For MongoDB Atlas, replace the local URI with your Atlas connection string. Never commit your real `.env` file or database credentials.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update task details |
| PATCH | `/api/tasks/:id/toggle` | Toggle completion |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Check API status |

## Suggested GitHub description

A responsive full-stack task management application that helps students organize assignments, study sessions, and deadlines with task CRUD, priority levels, categories, search, and completion tracking.

## Before adding it to your resume

Run the app, test every feature, and replace this README's setup details if you change the implementation. Only list technologies and features you can explain confidently. This project does not currently include authentication or multi-user accounts.
