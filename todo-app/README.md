# Todo App - WebAuthn Authentication

A modern Next.js 16 todo application with WebAuthn/Passkeys authentication, built with TypeScript, Tailwind CSS, and SQLite.

## Features

✅ **Passwordless Authentication**: WebAuthn/Passkeys support using biometrics, security keys, or device PIN  
✅ **Session Management**: Secure JWT sessions with HTTP-only cookies (7-day expiry)  
✅ **Route Protection**: Middleware-based authentication guards  
✅ **Singapore Timezone**: All date/time operations use Asia/Singapore timezone  
✅ **Database**: SQLite with better-sqlite3 for data persistence  
✅ **E2E Testing**: Playwright tests with virtual authenticator support  

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (better-sqlite3)
- **Authentication**: @simplewebauthn/server + @simplewebauthn/browser
- **Session**: JWT (jose library)
- **Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (for testing)
npx playwright install chromium
```

### Environment Setup

Create a `.env.local` file:

```bash
# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# WebAuthn settings
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run E2E tests (headless)
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed
```

## Project Structure

```
todo-app/
├── app/
│   ├── api/auth/          # Authentication API routes
│   │   ├── login-options/
│   │   ├── login-verify/
│   │   ├── logout/
│   │   ├── register-options/
│   │   └── register-verify/
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app (protected)
├── lib/
│   ├── auth.ts            # Session management (JWT)
│   ├── db.ts              # Database layer (SQLite)
│   └── timezone.ts        # Singapore timezone utilities
├── tests/
│   └── 01-authentication.spec.ts  # E2E tests
├── middleware.ts          # Route protection
└── playwright.config.ts   # Playwright configuration
```

## Authentication Flow

### Registration

1. User enters username (3-30 chars, alphanumeric + underscore)
2. Click "Register" → Browser prompts for biometric/PIN
3. WebAuthn creates credential on device
4. Server verifies response and creates user + authenticator in DB
5. Session JWT set as HTTP-only cookie
6. Redirect to main app

### Login

1. User enters username
2. Click "Login" → Browser prompts for biometric/PIN
3. WebAuthn verifies with existing credential
4. Server verifies response and updates authenticator counter
5. Session JWT set as HTTP-only cookie
6. Redirect to main app

### Session Management

- JWT tokens expire after 7 days
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=Strict (CSRF protection)

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
```

### Authenticators Table

```sql
CREATE TABLE authenticators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  credential_device_type TEXT NOT NULL,
  credential_backed_up INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Routes

### `GET /api/auth/register-options?username=<username>`
Generate WebAuthn registration challenge

### `POST /api/auth/register-verify`
Verify registration response and create user

### `GET /api/auth/login-options?username=<username>`
Generate WebAuthn authentication challenge

### `POST /api/auth/login-verify`
Verify authentication response and create session

### `POST /api/auth/logout`
Clear session cookie

## Testing

The E2E test suite covers:

✅ User registration with WebAuthn  
✅ Session persistence after page reload  
✅ Logout and re-login flow  
✅ Protected route redirects  
✅ Duplicate username error handling  
✅ Non-existent user error handling  
✅ Username validation  
✅ Logged-in user redirection from login page  

Run tests:

```bash
npm test
```

View test report:

```bash
npx playwright show-report
```

## Browser Support

WebAuthn requires modern browsers:

- ✅ Chrome 67+
- ✅ Safari 14+
- ✅ Edge 18+
- ✅ Firefox 60+

## Security Features

- **No password storage**: Eliminates password breach risk
- **HTTP-only cookies**: XSS protection
- **Secure cookies**: HTTPS only in production
- **SameSite=Strict**: CSRF protection
- **Counter verification**: Detects cloned authenticators
- **Challenge expiry**: 5-minute window for WebAuthn ceremony
- **User isolation**: All queries filtered by session user ID

## Development Notes

### Timezone Handling

All date/time operations use Singapore timezone (`Asia/Singapore`). Use the utilities in `lib/timezone.ts`:

```typescript
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

const now = getSingaporeNow(); // NOT new Date()
```

### Database Operations

The database uses synchronous operations (better-sqlite3). No async/await needed:

```typescript
import { userDB, authenticatorDB } from '@/lib/db';

const user = userDB.getByUsername('alice'); // Synchronous
```

### Session Management

Get session in API routes:

```typescript
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  // Use session.userId for queries
}
```

## Future Features

The following features will be implemented in subsequent PRPs:

- Todo CRUD operations
- Priority system (high/medium/low)
- Recurring todos
- Reminders & notifications
- Subtasks & progress tracking
- Tag system
- Template system
- Search & filtering
- Export/import
- Calendar view

## License

This is a workshop/demo application for learning purposes.

## Contributing

This application is built following Product Requirement Prompts (PRPs) located in the `../PRPs/` directory. Each PRP documents a specific feature with:

- Architecture diagrams
- Data models
- API specifications
- UI/UX behavior
- Test cases
- Acceptance criteria

Refer to `../PRPs/11-authentication-webauthn.md` for the authentication implementation details.
