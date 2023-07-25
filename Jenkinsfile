pipeline {
    agent any

    stages {
        stage("Prune Docker images older than 30 days") {
            steps {
                sh "docker image prune --all --filter 'until=720h'"
            }
        }
        stage("Build container") {
            steps {
                sh "docker build -t mediapipe-angular-playground:${env.GIT_COMMIT} ."
            }
        }
        stage("Remove old container") {
            steps {
                sh "docker rm -f mediapipe-angular-playground"
            }
        }
        stage("Run container") {
            steps {
                sh "docker run -d --name mediapipe-angular-playground -p 4200:80 mediapipe-angular-playground:${env.GIT_COMMIT}"
            }
        }
    }
}