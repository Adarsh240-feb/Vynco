# ⚡ Vynco

Your Network, Reinvented. Vynco transforms how professionals connect with instant QR digital business cards, smart networking, and real-time collaboration.

## 🌟 Features

- **Digital Business Cards**: Generate a personalized, shareable QR code linked to your professional identity.
- **Real-Time Feed**: Share updates, announcements, and insights with your network instantly.
- **Smart Connections**: Send and receive connection requests organically. 
- **Networking Groups**: Join or create specialized groups to discover professionals in your niche.
- **High-Performance Architecture**: Built with Next.js 14 App Router, featuring skeleton loading, optimistic UI updates, and server-side optimizations.
- **"Sapphire Night" Theme**: A stunning, premium dark mode aesthetic built with Tailwind CSS v4, featuring glassmorphism and fluid keyframe animations.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Generation**: [react-qr-code](https://github.com/rossiters/react-qr-code)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Firebase Auto)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed.

### 1. Clone & Install
```bash
git clone https://github.com/your-username/vynco.git
cd vynco
npm install
```

### 2. Environment Variables
Copy the example environment file and add your Firebase credentials:
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your Firebase config parameters:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

### 3. Deploy Firestore Rules
To ensure your database is secure, deploy the provided Firestore security rules and indexes:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## 📁 Project Structure

- `/src/app` - Next.js App Router pages (`auth`, `setup`, `dashboard`, `connections`)
- `/src/components` - Reusable UI components (`Navbar`, `Footer`, `FAB`, `Input`)
- `/src/components/ui/Skeleton.js` - Shimmer loading skeletons
- `/src/lib` - Firebase initialization and global Firestore service queries
- `/src/context` - React Context providers (AuthContext)

## 📄 License
This project is proprietary and confidential. All rights reserved.
