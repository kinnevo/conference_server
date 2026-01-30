# Conference Registration System - Server API

Express.js/Node.js server with PostgreSQL database and Socket.IO for real-time updates.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Authentication**: JWT (access + refresh tokens)
- **Deployment**: Railway

## Project Structure

```
conference_server/
├── src/
│   ├── config/
│   │   └── database.ts         # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification middleware
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── validation.ts       # Request validation
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   ├── profiles.ts         # Profile management routes
│   │   ├── areas.ts            # Areas of interest routes
│   │   └── admin.ts            # Admin-only routes
│   ├── services/
│   │   ├── authService.ts      # Authentication business logic
│   │   ├── profileService.ts   # Profile CRUD operations
│   │   └── areaService.ts      # Areas CRUD operations
│   ├── socket/
│   │   └── index.ts            # Socket.IO event handlers
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── index.ts                # Main server entry point
├── scripts/
│   └── init-db.sql             # Database initialization script
├── .env.example                # Environment variables template
├── package.json
├── tsconfig.json
└── railway.json                # Railway deployment config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd conference_server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Generate a secure random string (min 32 chars)
- `JWT_REFRESH_SECRET`: Generate a different secure random string (min 32 chars)
- `CORS_ORIGIN`: Your frontend URL (e.g., http://localhost:3000)

To generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Initialize the database:
```bash
npm run db:init
```

### Development

Start the development server with auto-reload:
```bash
npm run dev
```

Server will start on `http://localhost:3001`

### Production Build

1. Build TypeScript to JavaScript:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout user | Yes |
| GET | `/me` | Get current user | Yes |

### Profiles (`/api/profiles`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get own profile | Yes |
| PUT | `/me` | Update own profile | Yes |
| GET | `/:id` | Get profile by ID | Yes (Admin) |

### Areas (`/api/areas`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all areas | Yes |
| GET | `/:id` | Get area by ID | Yes |
| POST | `/` | Create new area | Yes |
| PUT | `/:id` | Update area | Yes |
| DELETE | `/:id` | Delete area | Yes |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profiles` | Get all profiles | Yes (Admin) |
| GET | `/stats` | Get registration stats | Yes (Admin) |

## Socket.IO Events

### Client → Server

- `area:created` - Broadcast new area to all clients
- `area:updated` - Broadcast area update to all clients
- `area:deleted` - Broadcast area deletion to all clients

### Server → Client

- `area:created` - New area created
- `area:updated` - Area updated
- `area:deleted` - Area deleted
- `profile:updated` - Profile updated (user-specific room)

## Database Schema

### Tables

- **users**: Authentication credentials
- **profiles**: User profile information
- **areas_of_interest**: Available areas/topics
- **refresh_tokens**: JWT refresh token management

See [init-db.sql](./scripts/init-db.sql) for complete schema.

## Deployment to Railway

### Prerequisites

1. Create a Railway account at [railway.app](https://railway.app)
2. Install Railway CLI (optional):
```bash
npm i -g @railway/cli
```

### Setup Steps

1. **Create New Project** on Railway dashboard

2. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically provides `DATABASE_URL` environment variable

3. **Add Server Service**:
   - Click "New" → "GitHub Repo" → Select your repository
   - Railway auto-detects configuration from `railway.json`

4. **Configure Environment Variables**:
   - Go to server service → "Variables" tab
   - Add the following:
     ```
     NODE_ENV=production
     JWT_ACCESS_SECRET=<your-generated-secret>
     JWT_REFRESH_SECRET=<your-generated-secret>
     CORS_ORIGIN=https://your-client-domain.railway.app
     ```
   - `DATABASE_URL` is automatically set by Railway

5. **Initialize Database**:
   - In Railway dashboard, open PostgreSQL service
   - Go to "Data" tab and run the SQL from `scripts/init-db.sql`
   - OR use Railway CLI:
     ```bash
     railway run psql $DATABASE_URL -f scripts/init-db.sql
     ```

6. **Generate Public Domain**:
   - Go to server service → "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.railway.app`)

7. **Update CORS_ORIGIN**:
   - Update the `CORS_ORIGIN` variable with your actual client URL
   - Redeploy if necessary

### Health Checks

Railway uses the `/health` endpoint to verify the server is running. The endpoint returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets automatically) | `3001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | 32+ character string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | 32+ character string |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:3000` |

## Security Notes

- Never commit `.env` file to version control
- Use strong, unique secrets for JWT tokens (minimum 32 characters)
- In production, always use HTTPS
- Implement rate limiting for authentication endpoints (future enhancement)
- Regularly rotate JWT secrets
- Set appropriate CORS origins (don't use `*` in production)

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify `DATABASE_URL` is correct
2. Check if PostgreSQL service is running
3. Ensure database has been initialized with `init-db.sql`

### Socket.IO Connection Issues

- Ensure client uses `wss://` (not `ws://`) in production
- Verify CORS configuration includes your client domain
- Check that WebSocket connections are allowed on Railway

### Port Issues

- Railway automatically assigns `process.env.PORT` - never hardcode the port
- Local development defaults to port 3001

## License

ISC
