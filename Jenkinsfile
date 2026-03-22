pipeline {
agent any

environment {
DOCKER_IMAGE_BACKEND = "session-planner-backend"
DOCKER_IMAGE_FRONTEND = "session-planner-frontend"
VERSION = "1.0.${env.BUILD_NUMBER}"
}

stages {

stage('Backend: Audit & Build') {
    steps {
        echo "Starting Backend Dependency Installation..."
        dir('backend') {
            bat 'npm install'
            echo "Running Backend Security Audit..."
            bat 'npm audit || exit 0'
            echo "Backend dependencies installed successfully."
        }
    }
}

stage('Frontend: Audit & Build') {
    steps {
        echo "Starting Frontend Dependency Installation..."
        dir('frontend') {
            bat 'npm install'
            echo "Building Frontend Application..."
            bat 'npm run build'
            echo "Running Frontend Security Audit..."
            bat 'npm audit || exit 0'
            echo "Frontend dependencies installed and built successfully."
        }
    }
}

stage('Docker: Build Images') {
    steps {
        echo "Building Docker image for Backend..."
        bat "docker build -t ${DOCKER_IMAGE_BACKEND}:${VERSION} ./backend"

        echo "Building Docker image for Frontend..."
        bat "docker build -t ${DOCKER_IMAGE_FRONTEND}:${VERSION} ./frontend"

        echo "Docker images built successfully with version ${VERSION}."
    }
}

stage('Infra: Validate Compose') {
    steps {
        echo "Validating docker-compose configuration..."
        bat 'docker compose config'
        echo "Docker Compose configuration validated."
    }
}

stage('Deploy') {
    steps {
        echo "Stopping existing containers if running..."
        bat 'docker compose down || exit 0'

        echo "Starting application containers..."
        bat 'docker compose up -d --build'

        echo "Deployment completed successfully."
    }
}


}

post {
always {
echo "Cleaning Jenkins workspace..."
cleanWs()
}

success {
    echo "Pipeline completed successfully!"
    echo "Application deployed with version ${VERSION}"
}

failure {
    echo "Pipeline failed. Please review the logs."
}

}
}
