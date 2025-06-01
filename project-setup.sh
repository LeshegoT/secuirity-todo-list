#!/bin/bash

# Initialize root files
touch .gitignore README.md

# Create shared directory for shared utils and models
mkdir -p shared/{models,utils}

# Create backend structure
mkdir -p backend/src/{controllers,routes,services,middlewares,utils,config,models}
mkdir -p backend/database
touch backend/src/{app.ts,server.ts} \
      backend/{.env.example,.eslintrc.json,.eslintignore,package.json,tsconfig.json}

# Create frontend structure
mkdir -p frontend/public/{styles,assets,js} frontend/src/{components,utils,models,types}
touch frontend/public/index.html \
      frontend/public/styles/main.css \
      frontend/src/main.ts \
      frontend/{.eslintrc.json,package.json,tsconfig.json}

# Create Flyway migrations directory
mkdir -p database/migrations
touch database/flyway.conf

# Create Terraform structure
mkdir -p terraform/modules
touch terraform/{main.tf,variables.tf,outputs.tf}

# Add basic .gitignore
cat > .gitignore <<EOL
# Node
node_modules/
dist/
*.log

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Terraform
.terraform/
*.tfstate
*.tfstate.backup

# Frontend
frontend/public/js/
EOL

# Backend .env.example
cat > backend/.env.example <<EOL
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# App Configuration
PORT=4000
NODE_ENV=development
API_BASE_URL=http://localhost:4000/api
EOL

# Backend package.json
cat > backend/package.json <<EOL
{
  "name": "backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "start": "NODE_ENV=production node dist/server.js",
    "dev": "NODE_ENV=development ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.1",
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0",
    "eslint": "^9.4.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
EOL

# Frontend package.json (no Python server)
cat > frontend/package.json <<EOL
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0",
    "eslint": "^9.4.0",
    "typescript": "^5.4.5"
  }
}
EOL

# Frontend tsconfig.json
cat > frontend/tsconfig.json <<EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["DOM", "ES2020"],
    "strict": true,
    "outDir": "./public/js",
    "rootDir": "./src",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true,
    "paths": {
      "@shared/*": ["../../shared/*"],
      "@frontend/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOL

# Frontend index.html
cat > frontend/public/index.html <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dynamic App</title>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <div id="app">
    <div class="loading">Loading application...</div>
  </div>
  <script src="js/main.js" type="module"></script>
</body>
</html>
EOL

# Frontend main.ts
cat > frontend/src/main.ts <<EOL
// Main application entry point
class App {
  private static API_BASE_URL = 'http://localhost:4000/api';

  static async init() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = \`
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading application...</p>
      </div>
    \`;

    try {
      const data = await this.fetchData();
      app.innerHTML = \`
        <header>
          <h1>Dynamic Content Loaded</h1>
          <p>Current time: \${new Date().toLocaleTimeString()}</p>
        </header>
        <main>
          <section id="content">
            \${this.renderData(data)}
          </section>
        </main>
      \`;
      this.setupEventListeners();
    } catch (error) {
      app.innerHTML = \`
        <div class="error">
          <h2>Error loading application</h2>
          <p>\${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button id="retry-btn">Retry</button>
        </div>
      \`;
      document.getElementById('retry-btn')?.addEventListener('click', () => this.init());
    }
  }

  private static async fetchData() {
    const response = await fetch(\`\${this.API_BASE_URL}/data\`);
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  }

  private static renderData(data: any) {
    return \`
      <div class="data-container">
        <h2>\${data.title || 'Default Title'}</h2>
        <p>\${data.description || 'No description available'}</p>
      </div>
    \`;
  }

  private static setupEventListeners() {
    setInterval(async () => {
      const contentSection = document.getElementById('content');
      if (contentSection) {
        try {
          const data = await this.fetchData();
          contentSection.innerHTML = this.renderData(data);
        } catch (error) {
          console.error('Failed to refresh data:', error);
        }
      }
    }, 30000);
  }
}

document.addEventListener('DOMContentLoaded', () => App.init());
EOL

# Frontend CSS
cat > frontend/public/styles/main.css <<EOL
:root {
  --primary-color: #3498db;
  --error-color: #e74c3c;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary-color);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: var(--error-color);
  text-align: center;
  padding: 2rem;
}

button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}

header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.data-container {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
EOL

# Final message
echo "Project structure created successfully!"
echo "To run:"
echo "1. Backend: cd backend && npm install && npm run dev"
echo "2. Frontend:"
echo "   - Build: cd frontend && npm install && npm run build"
echo "   - Then open frontend/public/index.html in your browser"
echo ""
echo "Note: The frontend is fully static. No Python or dev server required."
