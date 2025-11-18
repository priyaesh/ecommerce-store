# Docker Setup Guide

This guide explains how to run the e-commerce store using Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) installed (version 2.0 or later)

## Quick Start

### Production Mode

1. **Create environment files:**

   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://mongodb:27017/ecommerce-store
   JWT_SECRET=your-secret-key-change-in-production
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Seed the database:**
   ```bash
   docker-compose exec backend npm run seed
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

This will:
- Mount your local code as volumes for live updates
- Run in development mode with hot-reload
- Use development dependencies

## Docker Compose Commands

### Start Services
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

### Stop Services
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuild Services
```bash
# Production
docker-compose up -d --build

# Development
docker-compose -f docker-compose.dev.yml up -d --build
```

### Execute Commands in Containers
```bash
# Run seed script
docker-compose exec backend npm run seed

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh
```

### Remove Everything (including volumes)
```bash
# Production
docker-compose down -v

# Development
docker-compose -f docker-compose.dev.yml down -v
```

## Services

### MongoDB
- **Image:** mongo:7.0
- **Port:** 27017
- **Volume:** `mongodb_data` (persistent storage)
- **Database:** ecommerce-store

### Backend API
- **Port:** 5000
- **Health Check:** http://localhost:5000/api/products
- **Environment Variables:**
  - `MONGODB_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT tokens
  - `STRIPE_SECRET_KEY`: Stripe secret key

### Frontend
- **Port:** 3000
- **Health Check:** http://localhost:3000
- **Environment Variables:**
  - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/ecommerce-store
JWT_SECRET=your-secret-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### Frontend (.env.local)
```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Troubleshooting

### Port Already in Use
If ports 3000, 5000, or 27017 are already in use:
1. Stop the conflicting service
2. Or modify ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Change host port
   ```

### MongoDB Connection Issues
- Ensure MongoDB container is healthy: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string uses service name: `mongodb://mongodb:27017/...`

### Build Failures
- Clear Docker cache: `docker system prune -a`
- Rebuild without cache: `docker-compose build --no-cache`

### Permission Issues (Linux/Mac)
- Ensure Docker has proper permissions
- Try running with `sudo` if needed (not recommended for production)

### View Container Status
```bash
docker-compose ps
```

### Check Container Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

## Production Deployment

### Security Considerations
1. **Change default secrets:** Update `JWT_SECRET` and other sensitive values
2. **Use environment variables:** Don't commit `.env` files
3. **Enable HTTPS:** Use a reverse proxy (nginx, Traefik) with SSL
4. **Limit exposed ports:** Only expose necessary ports
5. **Use secrets management:** Consider Docker secrets or external secret managers

### Scaling
To scale services:
```bash
# Scale backend (if needed)
docker-compose up -d --scale backend=3
```

### Health Checks
All services include health checks. Monitor with:
```bash
docker-compose ps
```

## Clean Up

### Remove Containers and Networks
```bash
docker-compose down
```

### Remove Everything Including Volumes
```bash
docker-compose down -v
```

### Remove Images
```bash
docker-compose down --rmi all
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

