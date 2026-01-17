# Mebellar Admin Panel

A modern React admin panel built with Vite, TypeScript, and Ant Design.

## Tech Stack

- **Vite** - Build tool and dev server
- **React** - UI library
- **TypeScript** - Type safety
- **Ant Design** - UI component library
- **Zustand** - State management
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Axios** - HTTP client

## Getting Started
### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

The project includes a GitHub Actions workflow that automatically deploys to the server on push to `main` branch.

### Required Secrets

Configure the following secrets in your GitHub repository:

- `HOST` - Server hostname or IP
- `USERNAME` - SSH username
- `KEY` - SSH private key

### Server Setup

1. Copy `nginx.conf.example` to your server's Nginx configuration directory
2. Update the configuration as needed
3. The deployment workflow will deploy to `/var/www/mebellar-admin`
