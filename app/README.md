# AIGA Connect - Frontend

A React Native mobile application for connecting grapplers, their parents, and coaches in the AIGA academy.

## 🚀 Features

### Core Features
- **Authentication & User Management**
  - Login/Registration with IIN
  - Role-based access (Parent, Athlete, Coach)
  - Child profile linking for parents
  - Secure token management

- **Training Management**
  - View upcoming training sessions
  - Book/cancel training sessions
  - Create training sessions (coaches only)
  - Training details and participant management
  - Filtering and search capabilities

### User Roles

#### 👨‍👩‍👧‍👦 Parent
- Manage children's training schedules
- Book training sessions for children
- View training history

#### 🥋 Athlete
- Book training sessions
- View personal training schedule
- Access training details

#### 👨‍🏫 Coach
- Create and manage training sessions
- View student bookings
- Manage training schedules
- Access administrative features

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore & AsyncStorage
- **Icons**: Material Community Icons
- **Language**: TypeScript

## 📱 Screenshots

The app features a modern, dark-themed UI with:
- Clean, intuitive navigation
- Role-based interfaces
- Responsive design
- Loading states and error handling
- Pull-to-refresh functionality

## 🏗 Project Structure

```
app/src/
├── config/           # Configuration files
│   └── backend.ts    # API configuration
├── context/          # Global state management
│   └── AppContext.tsx
├── navigation/       # Navigation configuration
│   └── AppNavigator.tsx
├── pages/           # Screen components
│   ├── AuthScreen.tsx
│   ├── HomePage.tsx
│   ├── SchedulePage.tsx
│   ├── TrainingDetailPage.tsx
│   ├── CreateTrainingPage.tsx
│   ├── ProfilePage.tsx
│   ├── SettingsPage.tsx
│   └── GreetingPage.tsx
├── services/        # API service layer
│   ├── api.ts
│   ├── auth.ts
│   ├── training.ts
│   └── children.ts
├── utils/           # Utility functions
│   ├── constants.ts
│   └── helpers.ts
└── assets/          # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aiga-connect/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## 🔧 Configuration

### Backend Configuration
Update the backend URL in `src/config/backend.ts`:
```typescript
export const BACKEND_URL = 'http://your-backend-url.com';
```

### Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 📱 App Structure

### Navigation Flow
1. **Greeting Screen** - Welcome and role selection
2. **Authentication** - Login/Registration
3. **Main Tabs** - Role-based navigation
   - **Home** - Dashboard with upcoming trainings
   - **Schedule** - Training schedule and booking
   - **Profile** - User profile and settings

### Key Components

#### Authentication Flow
- Secure token-based authentication
- Automatic token refresh
- Role-based access control
- Child linking for parents

#### Training Management
- Real-time training data
- Booking system with confirmation
- Coach-specific training creation
- Participant management

#### User Management
- Profile editing
- Child account management
- Settings configuration

## 🎨 UI/UX Design

### Design System
- **Primary Color**: #E74C3C (Red)
- **Background**: #0D1B2A (Dark Blue)
- **Surface**: #1B263B (Card Background)
- **Text**: #FFFFFF (White) / #B0BEC5 (Secondary)

### Components
- **Cards**: Information containers
- **Buttons**: Primary and secondary actions
- **Lists**: Data display and navigation
- **Forms**: Input validation and submission
- **Modals**: Confirmation dialogs

## 🔒 Security

### Authentication
- JWT token-based authentication
- Secure token storage with Expo SecureStore
- Automatic token refresh
- Role-based access control

### Data Protection
- HTTPS communication
- Input validation
- Error handling without sensitive data exposure

## 🧪 Testing

### Manual Testing
- Test on both iOS and Android devices
- Verify all user roles and permissions
- Test offline scenarios
- Validate form inputs and error handling

### Key Test Scenarios
1. **Authentication**
   - Login with valid/invalid credentials
   - Registration with different roles
   - Token refresh functionality

2. **Training Management**
   - Book/cancel training sessions
   - Create training (coach role)
   - View training details

3. **User Management**
   - Profile editing
   - Child linking (parent role)
   - Settings configuration

## 🚀 Deployment

### Expo Build
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

### App Store Deployment
1. Configure app.json with proper metadata
2. Build production version
3. Submit to App Store/Google Play

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Core authentication and training management
- Role-based user interface 