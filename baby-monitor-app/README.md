# Baby Monitor Application

A full-stack baby monitoring application with real-time tracking of feeding, sleeping, diaper changes, and more.

## Features

- 👶 **Baby Profile Management** - Store and update baby information
- 🍼 **Feeding Tracker** - Log breast, formula, and solid feedings
- 😴 **Sleep Tracker** - Monitor sleep patterns and duration
- 🧷 **Diaper Tracker** - Track diaper changes and types
- 🛁 **Bath Time Log** - Record bath times and notes
- 📊 **Growth Chart** - Track height, weight, and milestones
- 🏥 **Checkups** - Schedule and log doctor appointments
- ⚠️ **Allergies** - Track allergies and medications
- 🔔 **Notifications** - Get reminders for feedings, medications, etc.
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

### Frontend
- React 18 with Hooks
- React Router DOM for navigation
- CSS3 with custom responsive design
- Fetch API for HTTP requests
- Context API for state management

### Backend
- Node.js with Express
- MongoDB (or your database)
- JWT Authentication
- RESTful API

## Setup Instructions

### 1. Frontend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd baby-monitor-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm start