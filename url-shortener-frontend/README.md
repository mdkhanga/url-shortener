# URL Shortener Frontend

A modern, responsive React TypeScript application for URL shortening.

## Features

- Clean, intuitive user interface
- URL shortening with optional custom codes
- One-click copy to clipboard
- Fully responsive design
- Real-time validation


## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd url-shortener-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the API URL in `.env`:
```
REACT_APP_API_URL=http://localhost:3001
```

### Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```