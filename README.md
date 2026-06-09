# GlobalMart Production CI/CD

## How to Run

### Prerequisites
- Node.js (for frontend)
- Java 25 (for backend)
- MongoDB Atlas account (configured in application.properties)

### Setup
1. Install dependencies in root directory:
   ```bash
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd globalmart-app
   npm install
   cd ..
   ```

### Run Both Servers
Run both frontend and backend concurrently from root directory:
```bash
npm run dev
```

### Run Backend Only
```bash
npm run dev:backend
```

### Run Frontend Only
```bash
npm run dev:frontend
```

## Project Structure
- **globalmart-api**: Spring Boot backend with MongoDB
- **globalmart-app**: Vite + TypeScript frontend
