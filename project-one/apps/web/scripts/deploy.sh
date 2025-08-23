#!/bin/bash

# JARVISH Platform Deployment Script
# Handles deployment to different environments with health checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="jarvish"
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=30

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_color "$YELLOW" "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_color "$RED" "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_color "$RED" "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        print_color "$RED" "Environment file .env.$ENVIRONMENT not found!"
        exit 1
    fi
    
    print_color "$GREEN" "All prerequisites met!"
}

# Function to run tests
run_tests() {
    print_color "$YELLOW" "Running tests..."
    
    npm run test:ci
    
    if [ $? -ne 0 ]; then
        print_color "$RED" "Tests failed! Aborting deployment."
        exit 1
    fi
    
    print_color "$GREEN" "All tests passed!"
}

# Function to build application
build_application() {
    print_color "$YELLOW" "Building application for $ENVIRONMENT..."
    
    # Build Docker image
    docker build \
        --build-arg NODE_ENV=$ENVIRONMENT \
        -t $PROJECT_NAME:$VERSION \
        -t $PROJECT_NAME:latest \
        .
    
    if [ $? -ne 0 ]; then
        print_color "$RED" "Build failed! Aborting deployment."
        exit 1
    fi
    
    print_color "$GREEN" "Build completed successfully!"
}

# Function to run database migrations
run_migrations() {
    print_color "$YELLOW" "Running database migrations..."
    
    # Load environment variables
    export $(cat .env.$ENVIRONMENT | xargs)
    
    # Run Supabase migrations
    npx supabase db push --db-url $DATABASE_URL
    
    if [ $? -ne 0 ]; then
        print_color "$RED" "Database migrations failed! Aborting deployment."
        exit 1
    fi
    
    print_color "$GREEN" "Database migrations completed!"
}

# Function to deploy application
deploy_application() {
    print_color "$YELLOW" "Deploying to $ENVIRONMENT..."
    
    case $ENVIRONMENT in
        development)
            deploy_development
            ;;
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
        *)
            print_color "$RED" "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Development deployment
deploy_development() {
    print_color "$YELLOW" "Starting development deployment..."
    
    # Use docker-compose for development
    docker-compose -f docker-compose.yml up -d
    
    print_color "$GREEN" "Development deployment completed!"
}

# Staging deployment
deploy_staging() {
    print_color "$YELLOW" "Starting staging deployment..."
    
    # Deploy to staging environment (example using Vercel)
    npx vercel deploy \
        --prod \
        --env-file=.env.staging \
        --scope=$VERCEL_SCOPE \
        --token=$VERCEL_TOKEN
    
    print_color "$GREEN" "Staging deployment completed!"
}

# Production deployment
deploy_production() {
    print_color "$YELLOW" "Starting production deployment..."
    
    # Create backup before deployment
    create_backup
    
    # Blue-green deployment
    print_color "$YELLOW" "Performing blue-green deployment..."
    
    # Deploy to green environment
    docker-compose -f docker-compose.prod.yml up -d --scale web=2
    
    # Wait for new instances to be healthy
    wait_for_health
    
    # Switch traffic to new instances
    docker-compose -f docker-compose.prod.yml up -d --scale web=1
    
    print_color "$GREEN" "Production deployment completed!"
}

# Function to create backup
create_backup() {
    print_color "$YELLOW" "Creating backup..."
    
    BACKUP_NAME="${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Backup database
    docker exec -t ${PROJECT_NAME}-postgres pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        > backups/${BACKUP_NAME}.sql
    
    # Backup uploaded files
    tar -czf backups/${BACKUP_NAME}_files.tar.gz uploads/
    
    print_color "$GREEN" "Backup created: ${BACKUP_NAME}"
}

# Function to perform health check
health_check() {
    print_color "$YELLOW" "Performing health check..."
    
    case $ENVIRONMENT in
        development)
            HEALTH_URL="http://localhost:3000/api/health"
            ;;
        staging)
            HEALTH_URL="https://staging.jarvish.ai/api/health"
            ;;
        production)
            HEALTH_URL="https://jarvish.ai/api/health"
            ;;
    esac
    
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        print_color "$YELLOW" "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
        
        response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
        
        if [ $response -eq 200 ]; then
            print_color "$GREEN" "Health check passed!"
            return 0
        fi
        
        print_color "$YELLOW" "Health check failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    print_color "$RED" "Health check failed after $HEALTH_CHECK_RETRIES attempts!"
    return 1
}

# Function to wait for health
wait_for_health() {
    if ! health_check; then
        print_color "$RED" "Deployment failed health checks. Rolling back..."
        rollback
        exit 1
    fi
}

# Function to rollback deployment
rollback() {
    print_color "$YELLOW" "Rolling back deployment..."
    
    # Restore from previous version
    docker-compose -f docker-compose.yml down
    docker run -d $PROJECT_NAME:previous
    
    print_color "$GREEN" "Rollback completed!"
}

# Function to run smoke tests
run_smoke_tests() {
    print_color "$YELLOW" "Running smoke tests..."
    
    npm run test:smoke:$ENVIRONMENT
    
    if [ $? -ne 0 ]; then
        print_color "$RED" "Smoke tests failed!"
        rollback
        exit 1
    fi
    
    print_color "$GREEN" "Smoke tests passed!"
}

# Function to notify deployment status
notify_deployment() {
    status=$1
    message=$2
    
    # Send Slack notification
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Deployment to $ENVIRONMENT: $status\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"$VERSION\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": false}
                    ]
                }]
            }"
    fi
}

# Function to update monitoring dashboards
update_monitoring() {
    print_color "$YELLOW" "Updating monitoring dashboards..."
    
    # Update Grafana annotations
    if [ ! -z "$GRAFANA_API_KEY" ]; then
        curl -X POST "$GRAFANA_URL/api/annotations" \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"dashboardId\": 1,
                \"time\": $(date +%s)000,
                \"tags\": [\"deployment\", \"$ENVIRONMENT\"],
                \"text\": \"Deployed version $VERSION to $ENVIRONMENT\"
            }"
    fi
    
    print_color "$GREEN" "Monitoring dashboards updated!"
}

# Main deployment flow
main() {
    print_color "$GREEN" "==============================================="
    print_color "$GREEN" "JARVISH Platform Deployment Script"
    print_color "$GREEN" "==============================================="
    
    # Parse arguments
    ENVIRONMENT=${1:-development}
    VERSION=${2:-$(git rev-parse --short HEAD)}
    
    print_color "$YELLOW" "Environment: $ENVIRONMENT"
    print_color "$YELLOW" "Version: $VERSION"
    
    # Execute deployment steps
    check_prerequisites
    run_tests
    build_application
    run_migrations
    deploy_application
    wait_for_health
    run_smoke_tests
    update_monitoring
    
    # Notify success
    notify_deployment "SUCCESS" "Version $VERSION successfully deployed to $ENVIRONMENT"
    
    print_color "$GREEN" "==============================================="
    print_color "$GREEN" "Deployment completed successfully!"
    print_color "$GREEN" "==============================================="
}

# Handle errors
trap 'handle_error' ERR

handle_error() {
    print_color "$RED" "Deployment failed!"
    notify_deployment "FAILED" "Deployment of version $VERSION to $ENVIRONMENT failed"
    rollback
    exit 1
}

# Run main function
main "$@"