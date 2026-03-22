# InvestWise AI - Smart Investment Recommendation Platform

InvestWise AI is a sophisticated, full-stack investment platform that leverages Machine Learning and real-time financial data to provide personalized investment recommendations. Built with a modern tech stack, it offers a seamless experience for both individual investors and platform administrators.

## 🚀 Key Features

### For Investors
- **AI-Powered Recommendations**: Personalized investment suggestions based on your income, age, risk tolerance, and investment goals using a Linear Regression model.
- **Real-Time Market Tracking**: Live stock prices for major tech companies (AAPL, GOOGL, MSFT, etc.) powered by Yahoo Finance.
- **Interactive Dashboard**: Visualize your portfolio performance, asset allocation, and risk vs. return analysis with dynamic charts.
- **Financial Profiling**: A comprehensive risk assessment tool to determine your investment personality.
- **Portfolio Management**: Track your active investments and monitor their expected growth in real-time.

### For Administrators
- **Admin Console**: A high-level overview of platform performance, including total user count and active sessions.
- **User Directory**: Manage and monitor all registered users and their roles.
- **Market Intelligence**: Real-time global market status and sentiment analysis via Alpha Vantage integration.
- **System Health**: Monitor API latency and system stability.

## 🛠 Tech Stack

- **Frontend**: React 18+, TypeScript, Tailwind CSS 4.0
- **Backend**: Node.js, Express
- **Database & Auth**: Firebase (Firestore & Authentication)
- **Visualizations**: Recharts (Area, Pie, and Scatter charts)
- **Animations**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **ML Logic**: Simple Statistics (Linear Regression)
- **Data Providers**: Yahoo Finance (yahoo-finance2), Alpha Vantage API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Firebase Project](https://console.firebase.google.com/)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd investwise-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project or use an existing one.
3. Enable **Authentication** (Google Sign-In provider).
4. Create a **Firestore Database** in test mode (or configure rules).
5. Register a Web App in your Firebase project settings.
6. Create a file named `firebase-applet-config.json` in the root directory with your credentials:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### 4. Environment Variables
Create a `.env` file in the root directory and add the following:

```env
# Required for Market Intelligence features
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Firebase Admin (Optional for backend operations)
# FIREBASE_SERVICE_ACCOUNT_JSON=...
```

## 🏃‍♂️ Running the Project

### Development Mode
To start the development server (Vite + Express):
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Production Build
To build the application for production:
```bash
npm run build
npm start
```

## 📂 Project Structure

- `/src`: Frontend React application
  - `/components`: Reusable UI components (Layout, Sidebar, etc.)
  - `/pages`: Main application views (Dashboard, Admin, Profile, etc.)
  - `/services`: Logic for API calls and Firebase interaction
  - `App.tsx`: Main routing configuration
  - `AuthContext.tsx`: Authentication state management
- `/server.ts`: Express backend serving the API and Vite middleware
- `firestore.rules`: Security rules for your database
- `firebase-blueprint.json`: Data structure definition for the platform

## 🛡 Security Rules
The project includes a `firestore.rules` file. Ensure you deploy these to your Firebase project to protect user data:
```bash
# If you have firebase-tools installed
firebase deploy --only firestore:rules
```

## 📈 API Endpoints

- `POST /api/predict`: Predicts investment returns based on user features.
- `GET /api/stock-prices`: Fetches real-time stock quotes from Yahoo Finance.
- `GET /api/market-insights`: Retrieves global market status from Alpha Vantage.

## 📄 License
This project is licensed under the MIT License.
