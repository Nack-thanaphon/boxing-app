# Omise Payment Microservices Project

This repository serves as a monorepo for a microservices-based application, integrating various services including a frontend, multiple backend services, a payment service, and a database, orchestrated using Docker Compose for local development and designed for Docker Swarm deployment in production.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development with Docker Compose](#local-development-with-docker-compose)
  - [Working with Git Submodules](#working-with-git-submodules)
- [Key Services](#key-services)
- [Deployment (Production)](#deployment-production)
  - [Updating Code on Server (Docker Stack)](#updating-code-on-server-docker-stack)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Frontend Application**: User interface for booking and interaction.
- **Backend Services**: API for core application logic, user management, event handling, etc.
- **Payment Service**: Dedicated service for handling payment processing with Omise.
- **PostgreSQL Database**: Persistent data storage for all services.
- **Nginx Reverse Proxy**: Centralized entry point, load balancing, and routing for all services.
- **Dockerized Environment**: Consistent development and production environments.

## Project Structure

This project uses Git submodules to manage its microservices and frontend applications. Each `application/` subdirectory is a separate Git repository.

- `application/BoxingFigth--Booking`: Frontend application (Next.js) - [Repository Link](https://github.com/Alphax13/BoxingFigth--Booking.git)
- `application/muay-thai-ticket-backend`: Core Backend service (Node.js/Express) - [Repository Link](https://github.com/Nuttachai20/muay-thai-ticket-backend.git)
- `application/payment-service`: Dedicated Payment service (NestJS)
- `application/backend-service`: A simple example backend service (Node.js)
- `nginx/`: Nginx configuration files for development and production.
- `docs/`: Project documentation.
- `init-db.sql`: SQL script for initializing the PostgreSQL database.
- `docker-compose.yml`: Docker Compose configuration for local development.
- `docker-compose.prod.yml`, `docker-compose.stack.yml`: Docker Compose configurations for production deployment with Docker Swarm.

### Working with Git Submodules

Git submodules allow you to embed Git repositories as subdirectories within another Git repository. This is useful for managing dependencies or components that are developed independently.

#### Initializing Submodules

After cloning the main `omise-payment` repository, you need to initialize and update the submodules:

```bash
git submodule update --init --recursive
```

- `git submodule update`: Fetches all data from the submodule projects and checks out the appropriate commit.
- `--init`: Initializes the new submodules if they haven't been initialized yet.
- `--recursive`: Applies the operation to any nested submodules as well.

#### Updating Submodules

To pull the latest changes from the submodule repositories:

```bash
git submodule update --remote
```

This command will fetch the latest commits from the upstream branches of your submodules and update them.

#### Cloning a Repository with Submodules

If you're cloning this repository for the first time and it contains submodules, you can clone and initialize them in one command:

```bash
git clone --recurse-submodules https://github.com/Nack-thanaphon/omise-payment.git
```

#### Common Issues and Tips

- **Detached HEAD:** When you update a submodule, it often puts the submodule repository in a "detached HEAD" state. This is normal. If you need to make changes within a submodule, `cd` into its directory and check out a branch: `cd application/BoxingFigth--Booking && git checkout main`.
- **Committing Submodule Changes:** If you make changes _within_ a submodule, you need to commit those changes within the submodule itself, push them to the submodule's remote, and then go back to the parent repository (`omise-payment`) to commit the _reference_ to the new submodule commit.

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine and Docker Compose)
- Git

### Local Development with Docker Compose

1.  **Clone the repository and initialize submodules:**

    ```bash
    git clone --recurse-submodules https://github.com/Nack-thanaphon/omise-payment.git
    cd omise-payment
    # If you cloned without --recurse-submodules:
    # git submodule update --init --recursive
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root directory or configure environment variables directly in `docker-compose.yml` for local testing.
    Example `docker-compose.yml` variables are already set up for local development. For Omise keys, you might need to set them in your environment or directly in `docker-compose.yml` (e.g., `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`, `OMISE_WEBHOOK_SECRET`).

3.  **Start the services:**

    ```bash
    docker compose up --build
    ```

    This command will build the images (if not already built) and start all the services defined in `docker-compose.yml`.

4.  **Access the application:**
    - Frontend: `http://localhost`
    - Payment Service Health Check: `http://localhost/health` or `http://localhost/api/v1/health`

### Key Services

- **`postgres`**: PostgreSQL database for persistent data.
- **`payment-service`**: NestJS application handling payment logic.
- **`backend-service`**: A simple Node.js backend.
- **`frontend`**: Next.js frontend application.
- **`nginx`**: Reverse proxy, routing traffic to the correct services.

## Deployment (Production)

For production deployment, this project is designed to be deployed on a Docker Swarm cluster using `docker stack deploy`. This provides high availability, rolling updates, and scalability.

### Updating Code on Server (Docker Stack)

When you have new code changes for your services (e.g., in `application/payment-service` or `application/BoxingFigth--Booking`), here's the typical workflow to update your deployed services on a server running Docker Swarm:

1.  **Update Submodules and Main Repository:**
    On your local machine or CI/CD pipeline, pull the latest changes for your main `omise-payment` repository and its submodules:

    ```bash
    # Navigate to the main project directory
    cd omise-payment
    # Pull latest from main repository
    git pull origin main
    # Update all submodules to their latest respective branches
    git submodule update --init --recursive --remote
    ```

    Ensure that the main repository's commit now points to the desired new commits of its submodules.

2.  **Build New Docker Images (CI/CD):**
    In a production setup, you would typically use a **CI/CD pipeline** (e.g., GitHub Actions, GitLab CI, Jenkins) to automatically:

    - Build new Docker images for any service that has updated code (e.g., `payment-service`, `frontend`, `backend-service`).
    - Tag these new images with a unique version number (e.g., `myrepo/payment-service:1.2.0`).
    - Push these new images to a **Docker Registry** (e.g., Docker Hub, AWS ECR, Google Container Registry).

    _Manual approach (less recommended for production):_ If you were doing it manually on the server (which is generally discouraged), you'd `git pull` the latest code, navigate into each service directory, and build the Docker image:

    ```bash
    # Example for payment-service
    cd application/payment-service
    docker build -t myrepo/payment-service:new-version .
    docker push myrepo/payment-service:new-version
    ```

3.  **Update Docker Stack:**
    Once the new Docker images are available in your registry, you will update the Docker Stack on your Swarm manager node. Assuming your `docker-compose.stack.yml` references these images with their new tags (or uses a `:latest` tag, though explicit tags are better for traceability):

    ```bash
    docker stack deploy -c docker-compose.stack.yml --with-registry-auth --prune my-app-stack
    ```

    - `-c docker-compose.stack.yml`: Specifies the stack definition file.
    - `--with-registry-auth`: If your images are in a private registry, this passes your authentication.
    - `--prune`: Removes services that are no longer present in the stack file.
    - `my-app-stack`: The name of your deployed stack.

    **Docker Swarm's Rolling Updates:** When you run `docker stack deploy` with updated image tags, Docker Swarm will detect the changes and perform a **rolling update**. This means it will gradually replace old containers with new ones, ensuring that your application remains available throughout the update process. If a new container fails to start, Swarm can automatically roll back to the previous version, minimizing impact.

### CI/CD Pipeline Example (Conceptual)

A typical CI/CD pipeline for this setup might look like this:

1.  **Git Push**: Developer pushes changes to `omise-payment` (main repo or a submodule).
2.  **Webhook Trigger**: Git repository (e.g., GitHub) triggers a webhook to the CI/CD system.
3.  **CI/CD Build Job**:
    - Clones `omise-payment` with `--recurse-submodules`.
    - Detects which submodules/services have changed.
    - Builds new Docker images for _only_ the changed services (and optionally `nginx` if its config changed).
    - Tags images with a unique version (e.g., Git commit SHA or semantic version).
    - Pushes images to Docker Registry.
    - Updates `docker-compose.stack.yml` (if using a dynamic image tag strategy) or simply proceeds if `latest` is used (again, explicit tags are preferred).
4.  **CD Deployment Job**:
    - Connects to the Docker Swarm manager.
    - Runs `docker stack deploy -c docker-compose.stack.yml --with-registry-auth --prune my-app-stack`.
    - Monitors the rolling update.

## API Endpoints

(You would list your main API endpoints here, e.g.)

- `GET /health`: Health check for payment service (via Nginx)
- `POST /api/v1/payments`: Create a new payment (via Nginx to payment-service)
- `GET /api/v1/seats`: Get available seats (via Nginx to backend-service or frontend API route)

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them (`git commit -m 'feat: Add new feature'`).
4. Push to your branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request to the `main` branch of the original repository.

## License

This project is licensed under the MIT License.
# boxing-app
