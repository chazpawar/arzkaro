# Building Your App: Complete Developer Guide

A beginner-friendly guide to building UI and features in this React Native app using Expo Router and NativeWind (Tailwind CSS).

---

## Table of Contents

1. [Understanding the App Structure](#understanding-the-app-structure)
2. [How File-Based Routing Works](#how-file-based-routing-works)
3. [Creating New Screens](#creating-new-screens)
4. [Styling with Tailwind (NativeWind)](#styling-with-tailwind-nativewind)
5. [Building UI Components](#building-ui-components)
6. [Working with the src Folder](#working-with-the-src-folder)
7. [Connecting Everything Together](#connecting-everything-together)
8. [Common Patterns & Examples](#common-patterns--examples)

---

## Understanding the App Structure

Your app follows a clean, organized structure:

```
arzkaro/
├── app/                    # 📱 Screens & Navigation (File-Based Routing)
│   ├── _layout.tsx        # Root layout (wraps everything)
│   ├── index.tsx          # Home screen (/)
│   ├── (auth)/            # Auth screens group
│   └── (main)/            # Main app screens group
│
├── src/                    # 🧩 Reusable Code
│   ├── components/        # UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API calls, Firebase
│   ├── utils/            # Helper functions
│   ├── context/          # React Context providers
│   └── lib/              # Third-party integrations
│
├── assets/                # 🎨 Images, fonts, icons
└── global.css            # 🎨 Global Tailwind styles
```

### Simple Explanation:

- **`app/` folder** = Your app's pages/screens (like pages in a website)
- **`src/` folder** = Shared code that multiple screens can use
- **`assets/` folder** = Pictures, icons, fonts

---

## How File-Based Routing Works

Expo Router uses **files to create routes** automatically. The file structure in `app/` directly maps to URLs in your app!

### How It Works:

| File Path                  | Route        | What It Means          |
| -------------------------- | ------------ | ---------------------- |
| `app/index.tsx`            | `/`          | Home screen            |
| `app/profile.tsx`          | `/profile`   | Profile screen         |
| `app/settings.tsx`         | `/settings`  | Settings screen        |
| `app/users/[id].tsx`       | `/users/123` | Dynamic user screen    |
| `app/(auth)/login.tsx`     | `/login`     | Login screen (grouped) |
| `app/(main)/dashboard.tsx` | `/dashboard` | Dashboard (grouped)    |

### Special Files:

- **`_layout.tsx`** - Wraps all screens in that folder (like a template)
- **`(folder)`** - Parentheses = route group (doesn't affect URL)
- **`[param]`** - Square brackets = dynamic route parameter

---

## Creating New Screens

### Step 1: Create a File in `app/`

**Example: Create a Profile Screen**

Create `app/profile.tsx`:

```tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">Profile Screen</Text>
      </View>
    </SafeAreaView>
  );
}
```

**That's it!** The route `/profile` is now automatically created. ✅

### Step 2: Navigate to It

```tsx
import { Link } from 'expo-router';

// Using Link component
<Link href="/profile" className="text-blue-500">
  Go to Profile
</Link>;

// Or using router programmatically
import { router } from 'expo-router';

router.push('/profile');
```

---

## Styling with Tailwind (NativeWind)

NativeWind lets you use Tailwind CSS classes in React Native using the `className` prop!

### Basic Styling

```tsx
import { View, Text } from 'react-native';

<View className="flex-1 bg-white p-4">
  <Text className="text-2xl font-bold text-blue-500">Hello World</Text>
</View>;
```

### Common Tailwind Classes

#### Layout & Spacing

```tsx
// Flexbox
<View className="flex flex-row items-center justify-between">

// Padding & Margin
<View className="p-4 mx-2 my-4">  {/* padding all, margin x, margin y */}
<View className="px-6 py-3">      {/* padding x and y */}

// Width & Height
<View className="w-full h-32">    {/* width full, height 32 */}
<View className="w-1/2 h-screen">  {/* width 50%, full height */}
```

#### Typography

```tsx
<Text className="text-sm font-normal text-gray-600">Small text</Text>
<Text className="text-lg font-semibold text-gray-900">Medium text</Text>
<Text className="text-2xl font-bold text-black">Large text</Text>
<Text className="text-3xl font-extrabold text-primary">Huge text</Text>
```

#### Colors

```tsx
// Background
<View className="bg-white">
<View className="bg-gray-100">
<View className="bg-blue-500">
<View className="bg-primary">  {/* Our custom color! */}

// Text Color
<Text className="text-white">
<Text className="text-gray-700">
<Text className="text-blue-500">
```

#### Borders & Rounded Corners

```tsx
<View className="border border-gray-300 rounded-lg">
<View className="border-2 border-blue-500 rounded-full">
<View className="rounded-xl shadow-md">
```

#### Dark Mode

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-white">Auto dark mode!</Text>
</View>
```

### Custom Colors in `tailwind.config.js`

```javascript
theme: {
  extend: {
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
    },
  },
}
```

Then use: `bg-primary`, `text-secondary`, etc.

---

## Building UI Components

Components go in `src/components/`. Organize them into folders:

### Folder Structure:

```
src/components/
├── ui/           # Basic UI elements (Button, Input, Card)
├── layout/       # Layout components (Header, Footer)
└── shared/       # Shared across app (UserAvatar, LoadingSpinner)
```

### Example: Create a Button Component

**File:** `src/components/ui/Button.tsx`

```tsx
import { Text, Pressable } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export default function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-6 py-3 rounded-lg ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}`}
    >
      <Text className="text-white font-semibold text-center">{title}</Text>
    </Pressable>
  );
}
```

### Using Your Component:

```tsx
import Button from '@/src/components/ui/Button';

<Button title="Click Me" onPress={() => console.log('Clicked!')} variant="primary" />;
```

### Example: Card Component

**File:** `src/components/ui/Card.tsx`

```tsx
import { View } from 'react-native';
import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-md border border-gray-200">{children}</View>
  );
}
```

**Usage:**

```tsx
import Card from '@/src/components/ui/Card';

<Card>
  <Text className="text-lg font-bold">Title</Text>
  <Text className="text-gray-600">Description</Text>
</Card>;
```

---

## Working with the src Folder

### 1. **Components** (`src/components/`)

Store reusable UI pieces here.

```tsx
// src/components/ui/Button.tsx
// src/components/layout/Header.tsx
// src/components/shared/UserAvatar.tsx
```

### 2. **Hooks** (`src/hooks/`)

Custom React hooks for reusable logic.

**Example:** `src/hooks/useAuth.ts`

```tsx
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    // Fetch user data
    setLoading(false);
  }, []);

  return { user, loading };
}
```

**Usage:**

```tsx
import { useAuth } from '@/src/hooks/useAuth';

function ProfileScreen() {
  const { user, loading } = useAuth();

  if (loading) return <Text>Loading...</Text>;

  return <Text>Hello, {user?.name}!</Text>;
}
```

### 3. **Services** (`src/services/`)

API calls, Firebase, external services.

**Example:** `src/services/firebase/auth.ts`

```tsx
import { auth } from './config';

export async function signIn(email: string, password: string) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error };
  }
}

export async function signOut() {
  await auth.signOut();
}
```

**Usage in screen:**

```tsx
import { signIn } from '@/src/services/firebase/auth';

async function handleLogin() {
  const result = await signIn(email, password);
  if (result.success) {
    router.push('/dashboard');
  }
}
```

### 4. **Utils** (`src/utils/`)

Helper functions that don't fit elsewhere.

**Example:** `src/utils/formatters/date.ts`

```tsx
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

**Example:** `src/utils/validators/email.ts`

```tsx
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### 5. **Context** (`src/context/`)

React Context for global state.

**Example:** `src/context/ThemeContext.tsx`

```tsx
import { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Add to** `app/_layout.tsx`:

```tsx
import { ThemeProvider } from '@/src/context/ThemeContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

---

## Connecting Everything Together

### Example: Complete Login Screen

**File:** `app/(auth)/login.tsx`

```tsx
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';

// Import from src/
import Button from '@/src/components/ui/Button';
import { signIn } from '@/src/services/firebase/auth';
import { isValidEmail } from '@/src/utils/validators/email';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // Validate
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    // Call service
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    // Navigate on success
    if (result.success) {
      router.replace('/dashboard');
    } else {
      Alert.alert('Error', 'Login failed');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-8">Welcome Back</Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={loading ? 'Loading...' : 'Sign In'}
          onPress={handleLogin}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
```

### How It All Connects:

1. **Screen** (`app/(auth)/login.tsx`) - The page user sees
2. **Component** (`src/components/ui/Button.tsx`) - Reusable button
3. **Service** (`src/services/firebase/auth.ts`) - Firebase login logic
4. **Validator** (`src/utils/validators/email.ts`) - Email validation
5. **Navigation** (`expo-router`) - Redirect after login

---

## Common Patterns & Examples

### 1. List with FlatList

```tsx
import { FlatList, View, Text } from 'react-native';

const users = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
];

<FlatList
  data={users}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View className="p-4 border-b border-gray-200">
      <Text className="text-lg">{item.name}</Text>
    </View>
  )}
/>;
```

### 2. Loading State

```tsx
import { ActivityIndicator, View } from 'react-native';

function MyScreen() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return <View>...content</View>;
}
```

### 3. Form with State

```tsx
const [form, setForm] = useState({
  name: '',
  email: '',
  age: '',
});

<TextInput
  value={form.name}
  onChangeText={(text) => setForm({ ...form, name: text })}
  placeholder="Name"
  className="border border-gray-300 rounded-lg px-4 py-3"
/>;
```

### 4. Image Display

```tsx
import { Image } from 'react-native';

// Local image
<Image
  source={require('@/assets/logo.png')}
  className="w-24 h-24 rounded-full"
/>

// Remote image
<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  className="w-full h-48 rounded-lg"
/>
```

### 5. Modal

```tsx
import { Modal, View, Text, Pressable } from 'react-native';

const [visible, setVisible] = useState(false);

<Modal visible={visible} transparent animationType="slide">
  <View className="flex-1 bg-black/50 justify-center items-center">
    <View className="bg-white rounded-xl p-6 w-4/5">
      <Text className="text-xl font-bold mb-4">Modal Title</Text>
      <Pressable onPress={() => setVisible(false)}>
        <Text className="text-blue-500">Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>;
```

### 6. Scrollable Screen

```tsx
import { ScrollView } from 'react-native';

<ScrollView className="flex-1 bg-white">
  <View className="p-4">{/* Long content */}</View>
</ScrollView>;
```

---

## Quick Tips

### ✅ DO:

- Keep screens in `app/`
- Keep reusable code in `src/`
- Use TypeScript for type safety
- Use Tailwind classes for styling
- Break large components into smaller ones
- Use meaningful file and variable names

### ❌ DON'T:

- Don't put business logic in screens
- Don't repeat code (create components/hooks)
- Don't forget to add keys to lists
- Don't use inline styles (use className)
- Don't import from `react-native` for SafeAreaView (use `react-native-safe-area-context`)

---

## Cheat Sheet

### Navigation

```tsx
import { router, Link } from 'expo-router';

// Navigate
router.push('/profile');
router.replace('/home');
router.back();

// Link
<Link href="/settings">Settings</Link>;
```

### Styling

```tsx
// Flexbox
className = 'flex flex-row items-center justify-between';

// Spacing
className = 'p-4 mx-2 my-4 gap-2';

// Colors
className = 'bg-white text-gray-900';

// Dark mode
className = 'bg-white dark:bg-gray-900';
```

### State

```tsx
const [value, setValue] = useState('');
const [count, setCount] = useState(0);
const [visible, setVisible] = useState(false);
```

---

## Next Steps

1. **Create your first screen** in `app/`
2. **Build a reusable component** in `src/components/`
3. **Add a service** for API calls in `src/services/`
4. **Style everything** with Tailwind classes
5. **Connect it all together** with navigation

**Happy coding!** 🚀

For more help, check:

- `docs/tailwind-setup.md` - Tailwind configuration
- `docs/safe-area-context.md` - Safe area usage
- `docs/running-on-devices.md` - Running your app
