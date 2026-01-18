# Grocerli Backend

Backend API for Grocerli with PostgreSQL + Prisma.

## Setup

### Prerequisites

- PostgreSQL installed and running
- Node.js 18+

### Installation

```bash
# Install dependencies
npm install

# Create database
createdb grocerli

# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### Environment Variables

Copy `.env` and update:

```env
DATABASE_URL="postgresql://thiagoricci@localhost:5432/grocerli?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:8080
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

## Running

```bash
# Development with auto-reload
npm run dev

# Production build
npm run build
npm start

# Prisma Studio (database GUI)
npm run prisma:studio
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Lists

- `GET /api/lists` - Get all user lists
- `GET /api/lists/active` - Get active list
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `POST /api/lists/:id/share` - Share list

### Recipes

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

## Database Schema

- `User` - User accounts
- `List` - Shopping lists
- `Recipe` - Saved recipes
- `UserPreferences` - User settings
- `SharedList` - List sharing

## Development

```bash
# View database
npm run prisma:studio

# Create migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```
