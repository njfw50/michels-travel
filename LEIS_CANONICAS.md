# 📜 CANONICAL LAWS - Michel's Travel

> **📖 Canonical Reference:** For full history, decisions, precedents, and executed commands, consult the [LIVRO_DA_VIDA.md](./LIVRO_DA_VIDA.md)

## 🎯 Fundamental Principles

This document defines the canonical laws governing the development of the Michel's Travel project. These laws ensure consistency, security, maintainability, and code quality.

---

## 🔴 DOGMAS (Absolute Rules - Non-Violable)

### DOGMA 1: All `/api/*` Endpoints Return JSON ONLY
**Priority:** P0 - Critical

**Rule:**
- All endpoints starting with `/api/*` MUST return JSON only
- Never return HTML, plain text, or other formats
- API errors must also be JSON with a canonical schema

**Implementation:**
```typescript
// ✅ Correct
app.use("/api/trpc", createExpressMiddleware({ router, createContext }));

// ❌ Incorrect
app.get("/api/users", (req, res) => {
  res.send("<html>...</html>"); // NEVER do this
});
```

**Verification:**
- All tRPC endpoints return JSON by default
- `server/_core/vite.ts` has explicit guards to skip API routes
- API errors return JSON with a canonical schema

---

### DOGMA 2: No Silent Failures - All Errors Are Explicit
**Priority:** P0 - Critical

**Rule:**
- NEVER return empty or default values when an error occurs
- ALL errors must be explicit and thrown
- NEVER use `if (!db) return []` - always throw an error

**Implementation:**
```typescript
// ❌ Incorrect (silent failure)
if (!db) return [];

// ✅ Correct (explicit error)
if (!db) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Database not available",
    cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
  });
}
```

**Verification:**
- All cases of unavailable database throw explicit errors
- No procedure returns empty arrays silently
- All errors use the canonical error schema

---

### DOGMA 3: Validate ALL Inputs with Zod
**Priority:** P0 - Critical

**Rule:**
- ALL tRPC procedures MUST have `.input(ZodSchema)`
- No procedure can accept inputs without validation
- Validation must be explicit and typed

**Implementation:**
```typescript
// ✅ Correct
publicProcedure
  .input(z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }))
  .mutation(async ({ input }) => {
    // input is typed and validated
  });

// ❌ Incorrect
publicProcedure.mutation(async ({ input }) => {
  // unvalidated input - NEVER do this
});
```

**Verification:**
- All procedures have `.input(ZodSchema)`
- No procedure exists without input validation

---

### DOGMA 4: External Service Isolation
**Priority:** P0 - Critical

**Rule:**
- ALL calls to external services MUST pass through adapters
- NEVER call external service SDKs directly in business code
- Adapters isolate external dependencies and facilitate provider swapping

**Implementation:**
```typescript
// ✅ Correct - Use adapter
import { SquarePaymentAdapter } from "./providers/square/adapter";

const adapter = new SquarePaymentAdapter(credentials);
const paymentLink = await adapter.createPaymentLink(order);

// ❌ Incorrect - Call SDK directly
import { Client } from "@square/square-sdk";
const client = new Client({ ... });
// NEVER do this in business code
```

**Verification:**
- Square: `server/providers/square/adapter.ts` exists and is used
- All Square calls pass through the adapter
- External service errors are wrapped in `ExternalAPIError`

---

### DOGMA 5: Contract-First - Configuration Is Explicit
**Priority:** P0 - Critical

**Rule:**
- Configuration must be explicit and validated
- Environment variables must be checked at startup
- In production, mandatory configurations must prevent initialization
- In development, optional configurations should log warnings

**Implementation:**
```typescript
// ✅ Correct
if (process.env.NODE_ENV === "production") {
  if (!ENV.oAuthServerUrl) {
    throw new Error("OAUTH_SERVER_URL is required in production");
  }
} else {
  if (!ENV.oAuthServerUrl) {
    console.warn("[OAuth] WARNING: OAUTH_SERVER_URL is not configured");
  }
}
```

**Verification:**
- OAuth: WARNING in dev, ERROR in prod
- Database: Explicit verification of DATABASE_URL
- All critical configurations are validated

---

### DOGMA 6: SQLite as Default Database for Development
**Priority:** P0 - Critical

**Rule:**
- **In development:** SQLite MUST be used as default (`DATABASE_URL=sqlite:./database.db`)
- **In production:** SQLite is allowed and recommended, MySQL is optional
- The system MUST automatically detect the database type by the `DATABASE_URL`
- The code MUST support both SQLite and MySQL without modifications
- SQLite Schema MUST be in `drizzle/schema.sqlite.ts`
- MySQL Schema MUST be in `drizzle/schema.ts`

**Implementation:**
```typescript
// ✅ Correct - Automatic detection
function detectDbType(url: string): "mysql" | "sqlite" {
  if (url.startsWith("sqlite:") || url.startsWith("file:")) {
    return "sqlite";
  }
  return "mysql";
}

// ✅ Correct - Dual support
if (_dbType === "sqlite") {
  _db = drizzleSQLite(_sqliteDb);
} else {
  _db = drizzleMySQL(dbUrl);
}
```

**Configuration:**
```env
# ✅ Default for development
DATABASE_URL=sqlite:./database.db

# ✅ Alternative for production (optional)
DATABASE_URL=mysql://user:password@localhost:3306/database
```

**Verification:**
- `server/db.ts` automatically detects SQLite vs MySQL
- `drizzle/schema.sqlite.ts` exists and is up to date
- `drizzle/schema.ts` exists for MySQL (optional)
- Default `.env` uses `DATABASE_URL=sqlite:./database.db`
- SQLite database is created automatically if it doesn't exist
- Schema is initialized automatically on first use

**Reason:**
- SQLite eliminates external dependencies in development
- Facilitates initial setup for new developers
- Does not require MySQL server installation/configuration
- Database is a simple file (`database.db`)
- Works perfectly in production for many use cases

---

### DOGMA 7: Canonical Law Compliance - No Changes Without Authorization
**Priority:** P0 - Critical

**Rule:**
- ALL system changes MUST be preceded by consulting the Canonical Laws
- NEVER remove, modify, or disable existing features without explicit authorization
- BEFORE any change, verify if it violates any DOGMA or LAW
- If a change violates any canonical law, it MUST be rejected or require explicit authorization
- The system MUST maintain all features established by canonical laws

**Change Process:**
1. **Mandatory Consultation:** Before any change, consult `LEIS_CANONICAS.md`
2. **Compliance Check:** Verify if the change violates any DOGMA or LAW
3. **Authorization:** If it violates any law, require explicit authorization from the maintainer
4. **Documentation:** If authorized, document the exception and the reason

**Implementation:**
```typescript
// ✅ Correct - Consult laws before changing
// 1. Check LEIS_CANONICAS.md
// 2. Confirm it doesn't violate DOGMA 1-6
// 3. If it does, request authorization
// 4. Only then make the change

// ❌ Incorrect - Change without consulting
// Remove login functionality without checking if it violates DOGMA 2 or DOGMA 3
```

**Examples of Violations:**
- Removing login system without authorization ❌
- Removing Zod input validation ❌
- Making APIs return HTML instead of JSON ❌
- Adding silent failures ❌
- Removing SQLite support without authorization ❌

**Verification:**
- All changes are preceded by consulting the laws
- No functionality is removed without authorization
- System maintains compliance with all DOGMAS
- Exceptions are documented when authorized

**Reason:**
- Ensures system consistency and stability
- Prevents regressions and loss of functionality
- Maintains quality and compliance with established architecture
- Protects the system against unauthorized changes

---

### DOGMA 8: Authentication System Is Mandatory and Must Be Visible
**Priority:** P0 - Critical

**Rule:**
- The authentication system (login/register) MUST always be present and functional
- The `/login` route MUST be configured in the frontend router
- The login button/link MUST be visible in the main navigation
- The `auth.register` and `auth.login` procedures MUST be implemented in the backend
- NEVER remove, hide, or disable the login system without explicit authorization
- The system MUST support email/password login (mandatory) and OAuth (optional)

**Frontend Implementation:**
```typescript
// ✅ Correct - Mandatory login route
<Route path={"/login"} component={Login} />

// ✅ Correct - Visible login button
<Link href="/login">
  <Button>Login</Button>
</Link>

// ❌ Incorrect - Remove login route
// ❌ Incorrect - Hide login button
// ❌ Incorrect - Disable login system
```

**Backend Implementation:**
```typescript
// ✅ Correct - Mandatory procedures
auth: router({
  register: publicProcedure.input(RegisterSchema).mutation(...),
  login: publicProcedure.input(LoginSchema).mutation(...),
  me: publicProcedure.query(...),
  logout: publicProcedure.mutation(...),
})

// ❌ Incorrect - Remove auth procedures
// ❌ Incorrect - Disable authentication
```

**Mandatory Verification:**
- [ ] `/login` route exists in `App.tsx` or main router
- [ ] `Login.tsx` page exists and is functional
- [ ] Login button/link is visible in navigation
- [ ] `auth.register` and `auth.login` procedures exist in the backend
- [ ] System supports email/password login
- [ ] System supports OAuth (optional, but must be implemented if configured)

**Prevention System:**
- Before any deploy or delivery, run a compliance check
- If any verification item fails, block the delivery
- Document exceptions when authorized

**Reason:**
- Authentication is a core system functionality
- Ensures secure access to user data
- Prevents unauthorized access to sensitive areas
