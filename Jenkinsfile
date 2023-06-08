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
                sh "docker build -t totem-angular:${env.GIT_COMMIT} ."
            }
        }
        stage("Remove old container") {
            steps {
                sh "docker rm -f totem-angular"
            }
        }
        stage("Run container") {
            steps {
                sh "docker run -d --name totem-angular -p 4200:80 totem-angular:${env.GIT_COMMIT}"
            }
        }
    }
}