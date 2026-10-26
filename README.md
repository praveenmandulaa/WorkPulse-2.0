WorkPulse 2.0
Employee Work Management, Attendance & Performance Evaluation System

WorkPulse 2.0 is a full-stack application for managing employee records, assigning and tracking tasks, recording attendance, and reviewing team performance. It provides role-based experiences for Admin, Manager, and Employee users.
Project status: Portfolio/development project. The frontend and backend must both be running for authentication and data-driven screens to work. Review the deployment and security configuration before using real employee data.

Technology stack
Layer	Technology
Frontend	React, TypeScript, Vite, CSS
Backend	PHP 8.4+, Laravel 13, REST-style APIs
Database	MariaDB 11 / MySQL-compatible database
Authentication	Laravel session authentication / Sanctum SPA CSRF flow
Web server	Nginx (Docker setup)
Development	Docker Compose, Node.js, Composer
Version control	Git and GitHub


Features
- Admin: Employee management, task oversight, attendance, performance analytics, reports, and settings.
- Manager: Team overview, assigned team members, team task management, attendance and performance summaries.
- Employee: Personal dashboard, check-in/check-out, attendance history, and assigned task tracking.
- Tasks: Priority, due date, progress, and statuses including todo, in_progress, in_review, completed, and blocked.
- Role-based access: Server-side API authorization restricts data and actions by user role.
Repository structure
WorkPulse-2.0/
├── backend/                 # Laravel API and database migrations
├── frontend/                # React + TypeScript + Vite application
├── docker/                  # Docker-related configuration (if present)
├── docker-compose.yml       # Docker services (verify filename in repository)
├── .env.docker.example      # Safe, non-secret Docker environment template (create if absent)
└── README.md
The directory names and Compose filename above describe the intended layout. If the repository uses a different filename or folder, adjust the commands accordingly.

Prerequisites
Recommended Docker setup
- Git
- Docker Desktop with Docker Compose enabled
- Free ports 5174 (React), 8080 (Laravel API), and the database port if published by Compose
Manual setup (without Docker)
- PHP 8.4+ with required Laravel extensions
- Composer
- Node.js LTS and npm
- MySQL 8+ or MariaDB 11+
Quick start — Docker (recommended)
1. Clone the repository
git clone https://github.com/praveenmandulaa/WorkPulse-2.0.git
cd WorkPulse-2.0
2. Create local environment files
If the repository includes .env.docker.example, copy it to .env.docker:

Windows PowerShell
Copy-Item .env.docker.example .env.docker
Copy-Item backend/.env.example backend/.env
macOS / Linux / Git Bash
cp .env.docker.example .env.docker
cp backend/.env.example backend/.env
If .env.docker.example does not exist, request the required variable names from the maintainer or create a safe example based on docker-compose.yml. Do not copy or commit anyone's real .env file.

Configure the values expected by your Compose file. Common values include:
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5174
VITE_API_URL=http://localhost:8080

DB_DATABASE=workpulse_docker
DB_USERNAME=workpulse
DB_PASSWORD=replace_with_your_own_password
DB_ROOT_PASSWORD=replace_with_a_different_password

SANCTUM_STATEFUL_DOMAINS=localhost:5174,localhost:8080
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=false
These are example variables, not a guaranteed complete configuration. Match the names used in the actual docker-compose.yml and backend/.env. Set DB_HOST=db and DB_PORT=3306 inside Laravel's Docker environment when the database service is named db. Use matching database credentials in both the database service and Laravel. Never publish real passwords or APP_KEY values.

3. Build and start the containers
docker compose --env-file .env.docker up -d --build
Check container status:
docker compose --env-file .env.docker ps
4. Install backend dependencies and generate the application key
docker compose --env-file .env.docker exec backend composer install
docker compose --env-file .env.docker exec backend php artisan key:generate
key:generate writes to Laravel's backend/.env. Confirm your Compose configuration uses that file or passes the generated APP_KEY to the backend container. Never generate a new key for an existing production installation with encrypted data.

5. Prepare the database
After the database container is healthy:
docker compose --env-file .env.docker exec backend php artisan migrate
If the repository provides seeders with demo accounts, run:
docker compose --env-file .env.docker exec backend php artisan db:seed
Important: db:seed only creates demo accounts if the repository actually includes the relevant seeders. The exact demo accounts and passwords are not guaranteed by this README. Do not run migrate:fresh on a database containing data you want to keep.
6. Open the application
Service	Local URL
React frontend	http://localhost:5174
Laravel API	http://localhost:8080


If the frontend container does not install dependencies automatically, run:
docker compose --env-file .env.docker exec frontend npm install
Then restart the frontend:
docker compose --env-file .env.docker restart frontend
7. Stop the application
docker compose --env-file .env.docker down
Do not add -v unless you intentionally want to delete named volumes, which may include your database data.
Alternative — Manual setup (without Docker)
These commands are a starting point; they assume your PHP extensions, database server, and project dependencies are compatible.
Backend
cd backend
composer install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
php artisan key:generate
Update backend/.env with a local database name, username, password, and host (127.0.0.1 for a local database). Then:
php artisan migrate
php artisan serve
The default Laravel development URL is http://127.0.0.1:8000.
Frontend
In a separate terminal:
cd frontend
npm install
Create frontend/.env.local:
VITE_API_URL=http://127.0.0.1:8000
Start Vite:
npm run dev
The default Vite URL is often http://localhost:5173 unless overridden in vite.config.ts. Ensure the Laravel Sanctum stateful domains and CORS allowed origins match the exact frontend host and port.
Authentication and demo accounts
WorkPulse uses role-based accounts for Admin, Manager, and Employee workflows. Demo passwords are intentionally not stored in this public README.

For a reproducible recruiter demo, maintainers should provide a safe development seeder that creates sample users and data with clearly documented, disposable credentials, or share access to a hosted demo separately. Never use production credentials in seeders or documentation.

For session-based SPA login, the frontend should first request Laravel's /sanctum/csrf-cookie, then submit the login request with cookies enabled. The frontend and API must be configured with compatible origins, session cookie settings, and Sanctum stateful domains.
Selected API endpoints
The following routes have been used in the project; availability and permissions depend on the current code and authentication state:
Method	Endpoint	Purpose
GET	/api/me	Current authenticated user
GET	/api/my-tasks	Tasks assigned to current user
GET	/api/tasks	Role-scoped task list
PATCH	/api/tasks/{id}/status	Update task status/progress


Use Laravel's route list to inspect the complete current API:
docker compose --env-file .env.docker exec backend php artisan route:list --path=api
Local custom domain (optional)
The project has also been tested locally using workpulse.local for React and api.workpulse.local for Laravel. These are local development hostnames, not public websites.

To use them, map both names to 127.0.0.1 in your operating system's hosts file and align Vite allowedHosts, API URL, Laravel CORS, Sanctum stateful domains, and session cookie domain. A typical local arrangement is:
- Frontend: http://workpulse.local:5174
- API: http://api.workpulse.local:8080
For the easiest first-time setup, use the localhost configuration above.
Deployment notes
- The React frontend can be deployed to Netlify using base directory frontend, build command npm run build, and publish directory dist.
- For client-side routing, place /*    /index.html   200 in frontend/public/_redirects.
- Netlify alone does not host the Laravel/PHP API or MariaDB database. A full working demo requires separate backend and database hosting.
- The production VITE_API_URL must point to a public HTTPS API, never to localhost or workpulse.local.
- If using Laravel Sanctum cookie-based SPA authentication, prefer frontend and API subdomains under the same registered domain, with HTTPS and secure cookies.
Troubleshooting
Problem	What to check
419 on login	CSRF cookie request, Axios credentials, session cookie domain, Sanctum stateful domains, CORS
401 from /api/me	Not logged in, session expired, or cookies not sent
React loads but data is missing	Laravel API URL, backend container, API authentication
Database connection error	Database container health, DB_HOST, credentials, migrations
Vite build fails	Run npm run build locally and resolve TypeScript errors
React route returns 404 on Netlify	Ensure frontend/public/_redirects is included in the build
Docker service fails	Inspect docker compose --env-file .env.docker logs <service>


Security and contribution notes
- Never commit .env, .env.docker, Laravel APP_KEY, access tokens, database dumps, or live passwords.
- Use .env.example / .env.docker.example with placeholder values only.
- Keep backend authorization enabled; frontend route guards are not a security boundary.
- Avoid exposing development databases or enabling APP_DEBUG=true on a public server.
- Before submitting a pull request, verify the frontend build and backend tests (if available).
Screenshots
Add real screenshots of the login page, admin dashboard, manager dashboard, employee dashboard, task management, attendance, and performance reports in a docs/screenshots/ directory, then link them here. Do not include personal employee data in screenshots.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1ac3e3e7-651a-444a-839a-546c8492c6c6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/94011e31-ddd3-40e1-9ead-c228e632a41c" />

Author
Praveen Kumar Mandula
GitHub: https://github.com/praveenmandulaa
WorkPulse 2.0 — built to demonstrate full-stack application architecture, REST APIs, role-based access, task management, and employee performance workflows.
