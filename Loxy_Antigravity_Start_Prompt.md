# Loxy — Antigravity Project Start Prompt

Build the **Loxy** personal password vault described in this project specification.

Treat the specification as the source of truth for the application's features, architecture, security requirements, UI/UX, and scope.

Do not just explain how to build it. **Start implementing the project.**

---

## 1. Inspect the Environment First

Before writing code:

1. Inspect the current workspace.
2. Check whether a React/Vite project already exists.
3. Check existing files and configuration.
4. Check whether Supabase configuration already exists.
5. Check installed dependencies.
6. Do not delete or overwrite existing useful work without understanding it.

If the workspace is empty, initialize the project using:

- React
- Vite
- TypeScript
- Tailwind CSS

Use a clean and maintainable project structure.

---

# 2. Application Identity

Project name:

**Loxy**

Tagline:

**Your keys. Your vault.**

Create a simple, premium, Gen-Z developer-oriented visual identity.

The design should feel modern and polished, inspired by the quality of products such as Linear, Raycast, Arc, or Vercel, but **do not copy their UI directly**.

The product should feel:

- Minimal
- Premium
- Secure
- Modern
- Developer-friendly
- Slightly Gen-Z
- Not childish
- Not overly corporate

---

# 3. Build the Foundation First

Implement:

- React
- Vite
- TypeScript
- Tailwind CSS
- Routing
- Supabase client
- Environment variable configuration
- Reusable UI components
- Dark theme

Create the project structure before building individual pages.

Use modular components.

Avoid putting the entire application into one component.

---

# 4. Login Page

Create a polished login page.

Example structure:

```text
                 LOXY

          Your keys. Your vault.

       Keep your passwords secure
          and organized.

      [ Continue with Google ]

              Secure vault
```

Make this page visually polished.

Use a subtle dark background and minimal security-related visual elements.

Do not use excessive animations.

---

# 5. Dashboard

Create the main authenticated dashboard.

Include:

- Sidebar
- Global search
- Dashboard summary
- Password list
- Add Password action
- User profile/avatar

Dashboard statistics:

- Total passwords
- Weak passwords
- Strong passwords

Password entries should show:

- Website/app icon
- Website/app name
- Username/email
- Hidden password
- Favorite status
- Category

---

# 6. Supabase

Configure the Supabase client using:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never hardcode secrets.

Never use the Supabase service-role key in frontend code.

---

# 7. Google Authentication

Implement Google authentication through Supabase Auth.

Implement:

- Login
- Session persistence
- Logout
- Protected routes
- Auth state handling
- Loading state
- Authentication errors

The user must authenticate before accessing the vault.

---

# 8. Database

Create the required Supabase tables.

## profiles

```text
id
email
display_name
avatar_url
created_at
```

## vault_items

```text
id
user_id
encrypted_data
category
is_favorite
created_at
updated_at
```

Enable Row Level Security.

Users must only be able to access their own vault items.

Do not rely only on frontend authorization.

---

# 9. Vault Unlock

After Google authentication, implement a separate vault-unlock mechanism.

Architecture:

```text
Google Login
     ↓
Authenticated User
     ↓
Vault Unlock
     ↓
Encryption Key
     ↓
Encrypted Vault
     ↓
Dashboard
```

The master password must never be stored as plaintext.

Use established cryptographic primitives and secure key derivation.

Do not invent custom cryptography.

Use Web Crypto API where appropriate.

---

# 10. Client-Side Encryption

This is a critical part of the project.

Before saving a password:

```text
User Input
    ↓
Create vault payload
    ↓
Encrypt client-side
    ↓
Send ciphertext to Supabase
```

When reading:

```text
Supabase ciphertext
    ↓
Client-side decryption
    ↓
Decrypted vault item
    ↓
Display in UI
```

The database must never contain readable passwords.

Do not log decrypted passwords.

Do not log encryption keys.

Do not put passwords into URLs.

---

# 11. Add Password

Create an Add Password modal.

Fields:

- Website/App Name
- Username/Email
- Password
- URL
- Category
- Notes
- Favorite

Buttons:

- Generate Password
- Save Password
- Cancel

When saving:

1. Validate data.
2. Encrypt sensitive data.
3. Save encrypted data.
4. Show success toast.
5. Close modal.
6. Refresh vault.

Do not log passwords.

---

# 12. Password Generator

Create a secure password generator.

Options:

- Length: 12–32
- Uppercase
- Lowercase
- Numbers
- Symbols

Use:

```javascript
crypto.getRandomValues()
```

Never use:

```javascript
Math.random()
```

Add:

- Generate
- Regenerate
- Copy
- Use Password

Show password strength:

- Weak
- Fair
- Strong
- Very Strong

---

# 13. Vault List

Display saved passwords as clean cards/list items.

Example:

```text
GitHub
user@example.com

••••••••••••

Development                         ⭐

                     👁  📋  ⋮
```

Actions:

- Show/hide
- Copy
- Favorite
- Edit
- Delete

Never show passwords openly by default.

---

# 14. Search

Create the global search bar:

```text
Search passwords...
```

Search by:

- Website
- Username
- Category

For the MVP, perform search locally after the vault has been unlocked and the authorized data is decrypted in memory.

Do not send plaintext passwords to the server for searching.

---

# 15. Categories

Use:

- Social
- Work
- College
- Banking
- Shopping
- Development
- Entertainment
- Other

Allow filtering by category.

---

# 16. Favorites

Allow credentials to be marked as favorites.

Use a star icon.

Create a dedicated Favorites view.

Make the interaction instant and smooth.

---

# 17. Security Dashboard

Create a simple security overview:

```text
Security

42 Total passwords

31 Strong
6 Weak
5 Reused
```

Calculate these values locally from decrypted data.

Do not send plaintext passwords to a server for analysis.

Add simple visual indicators.

Do not claim professional security auditing.

---

# 18. Password Details

Clicking a password item should open a details panel/modal.

Show:

- Website
- URL
- Username
- Password
- Notes
- Category
- Created date
- Updated date

Actions:

- Edit
- Delete
- Close

---

# 19. Delete Confirmation

Never immediately delete a credential.

Show a confirmation dialog:

> Delete GitHub?
>
> This password will be permanently removed from your vault.

Buttons:

- Cancel
- Delete

Use a clearly destructive confirmation action.

---

# 20. Auto Lock

Default:

**15 minutes**

Options:

- 5 minutes
- 15 minutes
- 30 minutes
- Never

When the vault locks:

- Remove decrypted sensitive data from application state.
- Return to the vault unlock screen.
- Require the master password again.

Also provide:

**Lock Vault**

in the UI.

---

# 21. Clipboard Security

When copying passwords:

- Copy password to clipboard.
- Show "Password copied".
- If practical, clear the clipboard after a short timeout.

Never show the actual password in notifications.

Good:

> Password copied

Bad:

> Copied password abc123!

---

# 22. Settings

Create a simple settings page.

## Account

- Google profile
- Email
- Logout

## Security

- Auto-lock duration
- Change master password
- Lock vault now

## Appearance

- Dark
- Light
- System

## Data

- Export encrypted vault
- Import encrypted vault

Clearly warn users about the security implications of exporting vault data.

---

# 23. UI Design

Use this palette:

```text
Background: #08080C
Surface: #111116
Surface Hover: #17171D
Border: #27272F
Primary: #8B5CF6
Primary Hover: #7C3AED
Text: #F7F7FA
Muted: #A1A1AA
Danger: #EF4444
Success: #22C55E
```

Use:

- Lucide icons
- Smooth transitions
- Subtle shadows
- Rounded cards
- Clean typography
- Strong spacing system
- Consistent button styles

Avoid:

- Excessive glassmorphism
- Neon cyberpunk styling
- Huge gradients
- Excessive animations
- Cartoon security graphics
- Generic AI-generated dashboard aesthetics

The interface should feel like a serious security product with a modern Gen-Z aesthetic.

---

# 24. Loxy Branding

Use the following branding consistently:

**Loxy**

**Your keys. Your vault.**

Create a minimal logo based around a key/lock concept.

The logo should be recognizable at small sizes.

Do not make the branding childish or overly playful.

Use "Loxy" consistently in:

- Navbar
- Login screen
- Browser title
- Favicon
- README
- Metadata
- Empty states where appropriate

---

# 25. Responsive Design

Desktop:

- Sidebar
- Main content
- Search
- Dashboard cards

Tablet:

- Collapsible sidebar

Mobile:

- Bottom navigation or compact navigation
- Full-width password cards
- Touch-friendly buttons
- Responsive forms
- Mobile-friendly modals

Test common mobile widths.

---

# 26. UX Quality

Every interaction should have a clear state.

Implement:

- Loading
- Success
- Error
- Empty
- Confirmation
- Disabled
- Hover
- Focus

Examples:

```text
Password copied
Password saved
Password deleted
Vault locked
Vault unlocked
```

Never show sensitive values inside toast messages.

Empty vault:

> Your vault is empty
>
> Start protecting your accounts by adding your first password.
>
> + Add Password

No search results:

> No passwords found
>
> Try a different search term.

---

# 27. Icons

Use a consistent icon library such as Lucide.

Use icons for:

- Search
- Plus
- Eye
- Eye off
- Copy
- Edit
- Delete
- Star
- Lock
- Settings
- Shield
- Key
- External link
- Logout

Do not mix random icon styles.

---

# 28. Security Rules

Strictly follow these rules:

1. Never store plaintext passwords in the database.
2. Never log passwords.
3. Never put passwords in URLs.
4. Never expose passwords in error messages.
5. Never expose Supabase service-role keys in frontend code.
6. Use Row Level Security.
7. Encrypt vault data before database storage.
8. Use authenticated encryption.
9. Use secure random generation.
10. Lock the vault after inactivity.
11. Clear decrypted sensitive data when locking.
12. Do not create custom cryptographic algorithms.
13. Do not claim security guarantees that have not actually been implemented.
14. Document the encryption architecture and limitations.

---

# 29. Error Handling

Handle:

- Google authentication failure
- Supabase connection failure
- Invalid vault password
- Encryption/decryption failure
- Database errors
- Network errors
- Session expiration
- Invalid forms
- Failed password generation

Never expose technical secrets to the user.

Use friendly messages such as:

> Unable to unlock your vault. Please check your master password.

Do not expose raw cryptographic errors to users.

---

# 30. Project Structure

Use a clean structure similar to:

```text
src/
├── components/
│   ├── auth/
│   ├── layout/
│   ├── vault/
│   ├── password/
│   ├── security/
│   └── ui/
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Security.tsx
│   └── Settings.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useVault.ts
│   └── useAutoLock.ts
│
├── lib/
│   ├── supabase.ts
│   ├── crypto.ts
│   └── passwordGenerator.ts
│
├── types/
│   └── vault.ts
│
└── App.tsx
```

Keep components modular.

Avoid putting everything into one huge component.

---

# 31. README

Create a professional README.

Include:

## Project

Loxy — Personal Password Vault

## Tagline

Your keys. Your vault.

## Features

List all implemented features.

## Tech Stack

List the technologies.

## Architecture

Explain:

```text
Google Auth
     ↓
Supabase Auth
     ↓
Vault Unlock
     ↓
Client-side Encryption
     ↓
Supabase PostgreSQL
```

## Security Model

Explain:

- What is encrypted.
- Where encryption occurs.
- Where decryption occurs.
- How authentication differs from vault unlocking.
- How Row Level Security protects records.

## Environment Variables

Document required variables without including real secrets.

## Local Setup

Provide:

```bash
npm install
npm run dev
```

## Supabase Setup

Explain:

- Create Supabase project
- Enable Google provider
- Configure redirect URL
- Create tables
- Enable RLS
- Add policies

---

# 32. Development Process

Do not simply generate a visual mockup.

Build the actual working application.

Work in this order:

1. Inspect workspace
2. Initialize/fix React + Vite + TypeScript
3. Configure Tailwind
4. Create Loxy design system
5. Configure Supabase
6. Implement Google authentication
7. Create database schema
8. Configure RLS
9. Implement vault encryption
10. Implement vault unlock
11. Build dashboard
12. Implement CRUD
13. Implement password generator
14. Implement search/filter
15. Implement favorites
16. Implement security dashboard
17. Implement auto-lock
18. Implement settings
19. Test authentication
20. Test encryption/decryption
21. Test database security
22. Test responsive UI
23. Fix errors
24. Polish UX

After each major feature:

1. Run the application.
2. Check for errors.
3. Fix errors.
4. Verify functionality.
5. Continue.

Do not make hundreds of changes without testing.

---

# 33. MVP Scope

Do NOT add unnecessary features such as:

- Browser extensions
- Mobile applications
- Team sharing
- Password sharing
- Family vaults
- Credit-card storage
- Identity documents
- Passkeys
- Enterprise administration
- Complex subscription systems
- AI assistant

These can be considered later.

The goal is a simple personal password vault that is actually functional and security-conscious.

---

# 34. Testing

Test this complete flow:

```text
Open Loxy
     ↓
Google Login
     ↓
Vault Unlock
     ↓
Dashboard
     ↓
Add GitHub account
     ↓
Generate password
     ↓
Save
     ↓
Search GitHub
     ↓
Open GitHub
     ↓
Copy password
     ↓
Edit password
     ↓
Mark favorite
     ↓
Lock vault
     ↓
Unlock vault
     ↓
Verify data
     ↓
Delete GitHub
```

Also verify:

- Refresh page
- Logout/login again
- Wrong master password
- Empty vault
- Search with no result
- Database permission isolation
- Mobile layout
- Network/API errors

---

# 35. Final Quality Requirement

Before considering the project complete, verify:

## Authentication

- Google login works.
- Logout works.
- Protected routes work.

## Vault

- Add password works.
- Edit works.
- Delete works.
- Search works.
- Copy works.
- Favorites work.
- Categories work.

## Security

- Database never contains plaintext passwords.
- RLS prevents cross-user access.
- Encryption/decryption works.
- Master password is not stored.
- Auto-lock works.
- Password generator uses secure randomness.

## UI

- Desktop works.
- Mobile works.
- No broken layouts.
- No placeholder buttons.
- No console errors.
- Loading and error states work.

Do not claim a feature is implemented unless it actually works.

---

# 36. First Action

**Start now.**

First inspect the workspace and existing project files.

Then:

1. Initialize/fix the React + Vite + TypeScript project.
2. Install only necessary dependencies.
3. Configure Tailwind.
4. Create the Loxy design system.
5. Build the Login page.
6. Build the application shell.
7. Configure Supabase.
8. Implement Google authentication.
9. Run the application and verify that the foundation works.

After completing those steps, continue automatically into the next implementation phase rather than stopping at a mockup.

The final goal is a **real, functional, security-conscious, polished Loxy password vault**, not a prototype screenshot.
