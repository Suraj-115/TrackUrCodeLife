# TrackUrCodeLife

TrackUrCodeLife is a full-stack competitive programming performance
tracker built for ABES students. It provides a centralized dashboard for
tracking student performance across **LeetCode** and **CodeChef**,
including contest ratings, solved problems, rankings, profile
information, and automated synchronization.

## Live Application

-   **Frontend:** https://track-ur-code-life.vercel.app/
-   **Backend API:** https://trackurcodelife.onrender.com

## Overview

TrackUrCodeLife is designed to solve the problem of manually checking
and comparing competitive-programming progress across different
platforms.

The application provides:

-   Student registration and login
-   College-email based authentication
-   OTP verification during registration
-   JWT-based authentication
-   LeetCode statistics
-   CodeChef statistics
-   Platform-based dashboard switching
-   Student leaderboard and rankings
-   Section filtering
-   Contest rating tracking
-   Problems-solved tracking
-   Contest participation data where available
-   Last contest date
-   Automatic student-statistics synchronization
-   MongoDB-based persistent storage
-   Responsive web dashboard
-   Production deployment using Vercel and Render

## Technology Stack

### Frontend

-   React
-   Vite
-   Axios
-   React Router
-   CSS

### Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT
-   Nodemailer
-   node-cron
-   Axios
-   Cheerio / scraping utilities where required for platform data

### Deployment

-   GitHub --- source-code repository
-   Vercel --- frontend hosting
-   Render --- backend hosting
-   MongoDB Atlas --- database hosting

## Project Structure

``` text
TrackUrCodeLife/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.css
│   │   ├── services/
│   │   │   └── api.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── codechef/
│   │   ├── leetcode/
│   │   └── sync/
│   │       ├── syncAllStudents.js
│   │       └── syncStudent.js
│   ├── app.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

> The exact directory contents may vary depending on the final project
> files and any additional components added during development.

## Core Features

### 1. Student Authentication

Students can create accounts using their college email address and
authenticate through the application.

The authentication flow includes:

1.  Student enters registration information.
2.  OTP is generated and sent through email.
3.  Student verifies the OTP.
4.  Account is created.
5.  Student can log in using their credentials.
6.  A JWT is used to authenticate protected API requests.

### 2. LeetCode Dashboard

LeetCode is the default platform on the main dashboard.

The dashboard can display information such as:

-   Problems solved
-   Contest rating
-   Contests participated
-   Last participated contest date
-   Last synchronization date

### 3. CodeChef Dashboard

The dashboard provides a platform filter for switching from LeetCode to
CodeChef.

CodeChef statistics include the corresponding student performance data
collected by the backend.

### 4. Leaderboard

Students can be ranked according to available metrics, including:

-   Contest rating
-   Problems solved
-   Contests participated
-   Last contest activity

The leaderboard also supports section-based filtering.

### 5. Data Formatting

Contest ratings are stored and displayed as numeric values.

Contest dates are formatted for display using the:

``` text
DD/MM/YYYY
```

format.

The database itself can retain dates as proper Date values while the
frontend formats them for users.

## Automated Synchronization

The backend contains synchronization services for updating student
competitive-programming statistics.

The synchronization structure includes:

``` text
server/services/sync/
├── syncStudent.js
└── syncAllStudents.js
```

The project also uses `node-cron` to schedule synchronization.

The current scheduler runs every six hours:

``` text
0 */6 * * *
```

The production backend logs:

``` text
Sync scheduler started (0 */6 * * *)
```

The synchronization process:

1.  Retrieves students from MongoDB.
2.  Fetches LeetCode statistics.
3.  Fetches CodeChef statistics.
4.  Validates and normalizes the returned values.
5.  Updates the corresponding MongoDB student document.
6.  Records the latest synchronization time.

## Data Reliability

The synchronization layer is designed to prevent invalid platform data
from breaking MongoDB updates.

Important considerations include:

-   Numeric contest ratings are converted to valid numbers.
-   Invalid `NaN` values are handled before database updates.
-   Contest dates are converted to valid Date values.
-   Missing platform statistics are handled safely.
-   Synchronization errors for one student should not unnecessarily stop
    processing other students.
-   Database validation is used to prevent invalid values from being
    stored.

## Backend API

The backend is an Express application.

The production API is hosted at:

``` text
https://trackurcodelife.onrender.com
```

The frontend communicates with the backend through Axios.

The frontend API configuration uses:

``` javascript
import axios from "axios";

const api = axios.create({
    baseURL: (
        import.meta.env.VITE_API_BASE_URL || "/api"
    ).replace(/\/$/, "")
});

export default api;
```

For production, the frontend environment variable points to:

``` text
https://trackurcodelife.onrender.com/api
```

## Environment Variables

Environment variables must not be committed to GitHub.

The local environment file should remain private:

``` text
.env
```

Typical backend variables include the variables required by the
application for:

-   MongoDB connection
-   JWT authentication
-   Email/OTP delivery
-   Server configuration
-   Other third-party services used by the application

The exact variable names must match the names used by the backend
through `process.env`.

For production:

-   Render environment variables are used for the backend.
-   Vercel environment variables are used for frontend build-time
    variables.
-   Secrets should never be hardcoded into source files.

Example frontend production variable:

``` env
VITE_API_BASE_URL=https://trackurcodelife.onrender.com/api
```

## Local Development

### Clone the repository

``` bash
git clone https://github.com/Suraj-115/TrackUrCodeLife.git
cd TrackUrCodeLife
```

### Backend

``` bash
cd server
npm install
npm start
```

The backend uses the environment configuration in:

``` text
server/.env
```

### Frontend

Open another terminal:

``` bash
cd client
npm install
npm run dev
```

The frontend will normally be available on the Vite development server.

## Production Deployment

### Backend --- Render

The backend is deployed as a Render Web Service.

Configuration:

``` text
Repository: TrackUrCodeLife
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
```

The production backend is:

``` text
https://trackurcodelife.onrender.com
```

MongoDB Atlas must allow the deployed backend to connect to the
database.

### Frontend --- Vercel

The frontend is deployed from the `client` directory.

Typical configuration:

``` text
Framework: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Production API configuration:

``` text
VITE_API_BASE_URL=https://trackurcodelife.onrender.com/api
```

The production frontend is:

``` text
https://track-ur-code-life.vercel.app/
```

## Database

TrackUrCodeLife uses MongoDB Atlas for persistent storage.

Student records contain account information and platform-specific
statistics.

The application uses Mongoose for:

-   Schema definition
-   Validation
-   Database queries
-   Student updates
-   Statistics synchronization

Database credentials are stored in environment variables and must never
be committed to GitHub.

## Security Considerations

The project follows several basic security practices:

-   `.env` is excluded from Git.
-   `node_modules` is excluded from Git.
-   Authentication uses JWT.
-   Passwords should never be stored in plaintext.
-   Email credentials are stored through environment variables.
-   MongoDB credentials are stored through environment variables.
-   Protected API routes require authentication.
-   Production CORS should only allow trusted frontend origins where
    practical.

Recommended `.gitignore` entries include:

``` gitignore
node_modules/
.env
.env.*
!.env.example
```

## Git Workflow

After making changes:

``` bash
git status
git add .
git commit -m "Describe your change"
git push origin main
```

Because the project is connected to Vercel and Render, changes pushed to
the configured production branch can trigger new deployments.

## Production Verification Checklist

After deployment, verify:

### Authentication

-   [ ] Signup works
-   [ ] OTP email is received
-   [ ] OTP verification works
-   [ ] Login works
-   [ ] Logout works

### Dashboard

-   [ ] Student information loads
-   [ ] LeetCode is the default platform
-   [ ] LeetCode rankings load
-   [ ] CodeChef rankings load
-   [ ] Platform switching works
-   [ ] Ranking filters work
-   [ ] Section filtering works

### Student Statistics

-   [ ] Problems solved display correctly
-   [ ] Contest rating is numeric
-   [ ] Contest dates display as DD/MM/YYYY
-   [ ] Last updated date displays correctly
-   [ ] Missing statistics do not crash the dashboard

### Backend

-   [ ] Render service is live
-   [ ] MongoDB connection succeeds
-   [ ] Protected APIs work
-   [ ] Synchronization service runs
-   [ ] node-cron scheduler starts
-   [ ] No unexpected errors appear in Render logs

### Deployment

-   [ ] Frontend is accessible through Vercel
-   [ ] Frontend calls the production Render API
-   [ ] Environment variables are configured
-   [ ] `.env` is not present in GitHub
-   [ ] `node_modules` is not present in GitHub

## Current Production Architecture

``` text
                    ┌────────────────────────────┐
                    │          Vercel            │
                    │       React + Vite         │
                    │                            │
                    │ TrackUrCodeLife Frontend   │
                    └─────────────┬──────────────┘
                                  │
                                  │ HTTPS / REST API
                                  ▼
                    ┌────────────────────────────┐
                    │          Render            │
                    │     Node.js + Express      │
                    │                            │
                    │ Authentication             │
                    │ Student APIs               │
                    │ Platform Services          │
                    │ Synchronization            │
                    │ node-cron                  │
                    └─────────────┬──────────────┘
                                  │
                                  │ Mongoose
                                  ▼
                    ┌────────────────────────────┐
                    │       MongoDB Atlas        │
                    │                            │
                    │ Student Data               │
                    │ Platform Statistics        │
                    └────────────────────────────┘

                 External Competitive Platforms
                         │              │
                         ▼              ▼
                    ┌─────────┐    ┌─────────┐
                    │LeetCode │    │CodeChef │
                    └─────────┘    └─────────┘
                         │              │
                         └──────┬───────┘
                                ▼
                         Backend Sync
```

## Project Status

### Completed

-   [x] Full-stack application
-   [x] Student authentication
-   [x] OTP-based signup
-   [x] JWT authentication
-   [x] MongoDB integration
-   [x] LeetCode statistics
-   [x] CodeChef statistics
-   [x] Leaderboard
-   [x] Platform switching
-   [x] Ranking/filter functionality
-   [x] Section filtering
-   [x] Data validation and reliability improvements
-   [x] Automated synchronization
-   [x] node-cron scheduler
-   [x] GitHub repository
-   [x] Render backend deployment
-   [x] Vercel frontend deployment

### Production URLs

**Frontend**

https://track-ur-code-life.vercel.app/

**Backend**

https://trackurcodelife.onrender.com

## Author

**Suraj**

TrackUrCodeLife --- Competitive Programming Performance Tracker
