# 📖 BOOK OF LIFE OF THE CANONICAL PROGRAMMING SYSTEM
## Michel's Travel - Canonical Production System

**Version:** 1.0.0  
**Creation Date:** 2025-01-02  
**Status:** In Active Development  
**Last Update:** 2025-01-02

---

## 📜 CANONICAL DECLARATION

This is the Book of Life of the Canonical Programming System for the Michel's Travel project. This document records:

- **Complete History:** All decisions, changes, and evolutions of the system
- **Sacred Commands:** All commands executed for restoration, establishment of laws, and revisions
- **Canonical Jurisprudence:** Legal basis for forming new canonical laws
- **Canonical System Law:** Conception and evolution of the canonical production system

This book serves as:
- ✅ Complete historical reference
- ✅ Legal basis for new laws
- ✅ Official canonical documentation
- ✅ Guide for past decisions
- ✅ Precedents for future decisions

---

## 📅 CANONICAL CHRONOLOGY

### ERA 1: FOUNDATION AND ESTABLISHMENT (2025-01-02)

#### 1.1. Establishment of the Canonical System
**Date:** 2025-01-02  
**Canonical Act:** Creation of the Canonical Laws system

**Context:**
- Michel's Travel project initiated
- Need to establish canonical development principles
- System based on immutable dogmas and laws

**Established Laws:**
- DOGMA 1: All `/api/*` return JSON ONLY
- DOGMA 2: No silent failures
- DOGMA 3: Validate ALL inputs with Zod
- DOGMA 4: External Service Isolation (Square adapter)
- DOGMA 5: Contract-first configuration

**Executed Commands:**
```bash
# Initial project creation
# Base structure established
```

**Canonical Decisions:**
- System must follow dogma-based architecture
- All decisions must be documented
- Canonical laws have P0 priority (Critical)

---

#### 1.2. Establishment of DOGMA 6: SQLite as Default
**Date:** 2025-01-02  
**Canonical Act:** DOGMA 6 - SQLite as Default Database for Development

**Context:**
- System initially configured only for MySQL
- Need to simplify development
- SQLite offers simplicity without an external server

**Identified Problem:**
```
Database not available. Please configure DATABASE_URL in .env file and run 'pnpm db:init'
```

**Canonical Solution:**
- SQLite MUST be used as default in development
- System MUST automatically detect database type
- Simultaneous support for SQLite and MySQL

**Executed Commands:**
```bash
# Creation of .env with DATABASE_URL=sqlite:./database.db
# Update of server/db.ts for dynamic support
# Creation of drizzle/schema.sqlite.ts
# Update of drizzle.config.ts for automatic detection
```

**Modified Files:**
- `server/db.ts` - Added dynamic SQLite/MySQL support
- `drizzle/schema.sqlite.ts` - SQLite-specific schema
- `drizzle.config.ts` - Automatic database type detection
- `.env` - Default SQLite configuration
- `LEIS_CANONICAS.md` - Added DOGMA 6

**Law Version:** 1.1.0

---

#### 1.3. Canonical Violation and Establishment of DOGMA 7
**Date:** 2025-01-02  
**Canonical Act:** DOGMA 7 - Canonical Law Compliance

**Context:**
- Login system was accidentally removed
- Violation of established canonical laws
- Need to prevent future violations

**Identified Problem:**
```
you removed the login system as commanded by the dogmas of the law
```

**Canonical Solution:**
- ALL changes MUST be preceded by consulting the Canonical Laws
- NEVER remove features without explicit authorization
- Mandatory verification process before changes

**Executed Commands:**
```bash
# Restoration of the login system
# Creation of DOGMA 7
# Establishment of mandatory consultation process
```

**Modified Files:**
- `server/routers.ts` - Restored auth.register and auth.login
- `server/db.ts` - Added getUserByEmail()
- `server/_core/password.ts` - Copied hash/verification file
- `LEIS_CANONICAS.md` - Added DOGMA 7

**Law Version:** 1.2.0

**Canonical Lesson:**
> "Never alter the system without first consulting the Canonical Laws. Every change must be preceded by a compliance check."

---

#### 1.4. Establishment of DOGMA 8 and Prevention System
**Date:** 2025-01-02  
**Canonical Act:** DOGMA 8 - Authentication System Is Mandatory

**Context:**
- Login system was not visible in the frontend
- Login button missing in navigation
- /login route not configured
- Violation of the mandatory visibility principle

**Identified Problem:**
```
the request for login restoration and establishment of the canonical law governing the login system was not obeyed before the frontend delivery, resulting in the login button not appearing
```

**Canonical Solution:**
- Authentication system MUST always be present and functional
- `/login` route MUST be configured
- Login button/link MUST be visible in navigation
- Automatic verification system MUST be run before deploy

**Executed Commands:**
```bash
# Copy of Login.tsx to client/src/pages/
# Addition of /login route in App.tsx
# Addition of login button in Home.tsx
# Creation of verify-canonical-compliance.ts
# Addition of pnpm verify:canonical script
```

**Created Files:**
- `client/src/pages/Login.tsx` - Complete login page
- `verify-canonical-compliance.ts` - Automatic verification system

**Modified Files:**
- `client/src/App.tsx` - Added /login route
- `client/src/pages/Home.tsx` - Added login button in navigation
- `package.json` - Added verify:canonical script
- `LEIS_CANONICAS.md` - Added DOGMA 8

**Law Version:** 1.3.0

**Created Prevention System:**
```typescript
// verify-canonical-compliance.ts
// Automatically verifies:
// - Login.tsx exists
// - /login route configured
// - Login button in navigation
// - auth.register and auth.login in backend
// - password.ts exists
// - getUserByEmail in db.ts
// - SQLite configured
// - Zod validation
```

**Result of First Verification:**
```
✅ System in compliance with all Canonical Laws!
Total: 10 | ✅ Approved: 10 | ❌ Failures: 0
```

---

## 📚 CANONICAL JURISPRUDENCE

### Precedent 1: Accidental Feature Removal
**Date:** 2025-01-02  
**Case:** Login system removed without authorization

**Canonical Decision:**
- Established DOGMA 7: Mandatory consultation before changes
- Created automatic verification process
- Prevention system implemented

**Established Precedent:**
> "No functionality can be removed, modified, or disabled without explicit authorization and prior consultation of the Canonical Laws."

**Future Application:**
- All changes must undergo verification
- Automatic verification system must be run before deploy
- Any violation must result in delivery blocking

---

### Precedent 2: Mandatory Visibility of Core Features
**Date:** 2025-01-02  
**Case:** Functional login system but not visible in the frontend

**Canonical Decision:**
- Established DOGMA 8: Mandatory and visible authentication system
- Core features must always be accessible
- Frontend and backend must be synchronized

**Established Precedent:**
> "Core system features must always be present, functional, and visible. Backend and frontend must always be synchronized."

**Future Application:**
- Automatic frontend/backend synchronization check
- Mandatory checklist before delivery
- Prevention system must verify visibility

---

### Precedent 3: Default Configuration for Development
**Date:** 2025-01-02  
**Case:** System initially configured only for MySQL

**Canonical Decision:**
- Established DOGMA 6: SQLite as default for development
- System must support multiple configurations
- Automatic database type detection

**Established Precedent:**
> "Systems should be configured with defaults that simplify development but support multiple configurations for production."

**Future Application:**
- Development defaults should be simple
- Support for multiple configurations when necessary
- Automatic environment detection

---

## 🔧 REGISTERED CANONICAL COMMANDS

### Restoration Commands

#### Login System Restoration
```bash
# Copy password file
Copy-Item -Path "michels-travel\server\_core\password.ts" -Destination "server\_core\password.ts" -Force

# Add getUserByEmail to db.ts
# Restore auth.register and auth.login in routers.ts
# Add necessary imports (hashPassword, verifyPassword, getUserByEmail, sdk, TRPCError)
```

#### Login Frontend Restoration
```bash
# Copy Login.tsx
Copy-Item -Path "michels-travel\client\src\pages\Login.tsx" -Destination "client\src\pages\Login.tsx" -Force

# Add route in App.tsx
# Add login button in Home.tsx
```

### Law Establishment Commands

#### Establishment of DOGMA 6
```bash
# Create .env with DATABASE_URL=sqlite:./database.db
# Modify server/db.ts for dynamic support
# Create drizzle/schema.sqlite.ts
# Update drizzle.config.ts
# Update LEIS_CANONICAS.md version 1.1.0
```

#### Establishment of DOGMA 7
```bash
# Add DOGMA 7 to LEIS_CANONICAS.md
# Establish mandatory consultation process
# Update version to 1.2.0
```

#### Establishment of DOGMA 8
```bash
# Add DOGMA 8 to LEIS_CANONICAS.md
# Create verify-canonical-compliance.ts
# Add pnpm verify:canonical script
# Update version to 1.3.0
```

### Verification Commands

#### Compliance Verification
```bash
# Run automatic verification
pnpm verify:canonical

# Expected result:
# ✅ System in compliance with all Canonical Laws!
```

---

## 📋 CANONICAL VERIFICATION CHECKLIST

### Mandatory Verifications (DOGMA 8)
- [ ] Login.tsx exists in `client/src/pages/Login.tsx`
- [ ] `/login` route configured in `App.tsx`
- [ ] Login button/link visible in main navigation
- [ ] auth.register and auth.login procedures in backend
- [ ] password.ts exists in `server/_core/`
- [ ] getUserByEmail exists in `server/db.ts`
- [ ] SQLite configured as default in `.env`
- [ ] Zod validation present in all procedures
- [ ] SQLite schema up to date
- [ ] Automatic verification system functional
