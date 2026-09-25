# LOXY — Personal Password Vault

> **Your keys. Your vault.**

Loxy is a modern, zero-knowledge personal password vault built for speed, privacy, and developer aesthetics. 

All sensitive vault credentials (passwords, usernames, notes, URLs) are encrypted and decrypted **purely on your client machine** using the native Web Crypto API. The database and backend only ever store authenticated AES-GCM ciphertexts.

---

## ✨ Features

- 🔐 **Zero-Knowledge Client-Side Encryption**:
  - Key derivation using **PBKDF2** (SHA-256, 100,000 iterations, 32-byte cryptographically secure random salt).
  - Authenticated symmetric encryption with **AES-GCM (256-bit)** using unique 12-byte initialization vectors (IVs) per item.
  - Zero plaintext sensitive vault data is ever sent to or stored in Supabase or any server.
- 🔑 **Independent Master Password**:
  - Separate vault unlock password.
  - Master password is never transmitted, never stored in the database, and never logged.
  - Verification sentinel token detects correct/incorrect master password without persisting credentials.
- ⚡ **Authentication Options**:
  - **Google OAuth** via Supabase Auth.
  - **Developer Sandbox Mode** for immediate offline/local testing without cloud provider setup.
- ⏱️ **Configurable Auto-Lock**:
  - Automatically wipes decrypted secrets and derived keys from memory upon inactivity (5m, 15m, 30m, or manual lock).
  - Immediate `Lock Vault` button in the navigation bar.
- 🛡️ **Security Dashboard**:
  - Client-side password audit: evaluates total credentials, strong passwords, weak passwords, and reused passwords.
  - Never sends plaintext passwords to external analysis services.
- 🎲 **Cryptographically Secure Password Generator**:
  - Powered by `crypto.getRandomValues()` (never `Math.random()`).
  - Customizable character sets (uppercase, lowercase, numbers, symbols) and length slider (12–32 characters).
  - Real-time entropy strength meter.
- 📂 **Categorized & Searchable Vault**:
  - Categories: *Development, Work, Social, Banking, Shopping, College, Entertainment, Other*.
  - Star / Pin Favorites with a dedicated Favorites view.
  - Instant client-side search across websites, usernames, URLs, and categories (`⌘K` hotkey).
- 📋 **Secure Clipboard Operations**:
  - One-click copy for usernames and passwords with ephemeral feedback.
  - Passwords masked by default with show/hide toggle.
- 💾 **Encrypted Backup & Migration**:
  - Export zero-plaintext encrypted JSON vault backups.
  - Ready-to-run Supabase PostgreSQL schema with Row Level Security (`supabase/schema.sql`).

---

## 🔒 Security Architecture

```text
               Google Login / Dev Sandbox
                          ↓
                  Authenticated User
                          ↓
                  Enter Master Password
                          ↓
            PBKDF2 Key Derivation (Local Web Crypto)
                          ↓
                 Derived 256-bit AES Key
                          ↓
          ┌───────────────┴───────────────┐
          ↓                               ↓
Decrypt Vault Locally           Encrypt Vault Locally
(In-Memory State Only)          (Unique 12-byte IV per item)
          ↓                               ↓
    User Interactions            Ciphertext Payload Only
                                          ↓
                                 Supabase PostgreSQL
                              (Row Level Security: auth.uid())
```

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Supabase Auth + RLS)
- **Cryptography**: Native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (`SubtleCrypto`: PBKDF2, AES-GCM)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/subha-3128/Loxy.git
cd Loxy
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Supabase credentials in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note**: If you run Loxy without Supabase credentials, the app will automatically boot in **Local Encrypted Sandbox Mode**, allowing full end-to-end functionality using client-side encrypted local storage.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)

If using Supabase, navigate to your Supabase project's **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql):

```sql
-- Schema creates:
-- 1. profiles table with RLS (auth.uid() = id)
-- 2. vault_items table with RLS (auth.uid() = user_id)
-- 3. vault_settings table with RLS (auth.uid() = user_id)
-- 4. Automatic profile creation trigger on user signup
```

In your Supabase dashboard:
1. Go to **Authentication** > **Providers** > **Google**.
2. Enable Google OAuth and add your Google Cloud OAuth Client ID and Secret.
3. Add `http://localhost:5173` (and your production domain) to **URL Configuration** > **Redirect URLs**.

---

## 🧪 Testing Cryptography & Generator

Loxy includes automated self-checks for cryptographic correctness and entropy verification:

```bash
# Test PBKDF2 derivation, AES-GCM encryption/decryption & verification sentinels
npx -y tsx src/lib/crypto.test.ts

# Test secure password generation & entropy evaluation
npx -y tsx src/lib/passwordGenerator.test.ts
```

---

## 🛡️ Security Guarantees & Limitations

1. **Zero-Knowledge**: Your master password and plaintext credentials are never sent to the network, logged, or stored in any database.
2. **Encrypted Storage**: The database only sees Base64-encoded ciphertext and initialization vectors.
3. **No Key Recovery**: Because Loxy does not hold a backdoor key or your master password, if you forget your master password, encrypted data cannot be decrypted.
4. **Endpoint Security**: The security of client-side encryption depends on the integrity of your device and browser environment.

---

## 📄 License

MIT License. Crafted with precision for privacy-conscious developers.
