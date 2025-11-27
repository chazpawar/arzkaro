# 🚀 **ARZKARO — FINAL PROJECT OVERVIEW & SETUP PLAN**

Arzkaro is designed as a **modular, future-proof mobile ecosystem** built with:

### **Frontend**

- **Expo + React Native**
- **Expo Router** for file-based navigation
- UI: NativeWind / Tamagui / Custom components
- State: React Context + React Query
- Device support: Android, iOS, Web (optional)

### **Backend**

- **Firebase Authentication**
- **Firestore Database**
- **Firebase Storage**
- Optional Future:
  - Firebase Cloud Functions
  - Custom microservices
  - Custom backend replacement without breaking UI

### **Core Philosophy**

Arzkaro follows a **cleanly decoupled, scalable architecture**:

- UI layer is independent of backend
- Firebase SDK is isolated inside a dedicated service layer
- Easy migration to a custom backend or additional APIs later
- Strong developer experience (DX) + clear separation of concerns

---

# 📁 **FINAL FOLDER STRUCTURE FOR ARZKARO**

```
Arzkaro/
├── app/                         # Expo Router screens
│   ├── (auth)/
│   ├── (main)/
│   ├── _layout.tsx
│   └── index.tsx
│
├── src/                         # ALL core logic here
│   ├── components/              # UI library
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   │
│   ├── services/                # Backend logic (Firebase now, others later)
│   │   ├── firebase/
│   │   └── index.ts
│   │
│   ├── hooks/                   # Custom hooks
│   └── utils/                   # Helpers + constants
│
├── assets/                      # Images, fonts, icons
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

# 🧱 **STACK CHOICES FOR ARZKARO**

## **Frontend Stack**

- **Expo + React Native**
  Fast development, minimal native config, supports all platforms.

- **Expo Router**
  Modern file-based routing (similar to Next.js).

- **TypeScript**
  Reliability + scalability for a long-term app.

- **NativeWind or Tamagui**
  - NativeWind for Tailwind-style simplicity
  - Tamagui for cross-platform design systems

- **React Hooks**
  Built-in state management with useState, useReducer, and custom hooks.

---

# 🔥 **Backend Stack (Modular Firebase Layer)**

Arzkaro uses Firebase initially, but with architecture that allows switching:

### **1. Authentication**

- Email/password
- Phone OTP
- Social logins (optional)

### **2. Database Layer**

- Firestore
  - Simple reads/writes
  - Offline support
  - Real-time listeners

### **3. Storage Layer**

- Firebase Storage
  - Upload images
  - Fetch URLs
  - Store user files

### **4. Future Backends (Plug-n-Play)**

Because of the service-layer abstraction, you can migrate to:

- Supabase
- Your own Node.js backend
- Python/FastAPI
- Go microservices
- Custom vector DB
- Local embeddings
- Anything

Without changing the UI.

---
