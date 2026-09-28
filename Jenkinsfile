// Execute como Multibranch Pipeline no repositorio da API Node.js.
// A API deve ter package-lock.json, scripts lint/test e testes em reports/*.xml.
// Este Dockerfile da pasta pratica cria o controller; APP_DOCKERFILE deve
// apontar para o Dockerfile da API no repositorio, com contexto na raiz.
// ACR e Container Apps devem existir; configure acesso ao ACR nos apps.
def executarAzure(String comandos) {
    withCredentials([
        usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZURE_CLIENT_ID', passwordVariable: 'AZURE_CLIENT_SECRET'),
        string(credentialsId: 'azure-tenant', variable: 'AZURE_TENANT_ID'),
        string(credentialsId: 'azure-subscription', variable: 'AZURE_SUBSCRIPTION_ID')
    ]) {
        withEnv(["AZURE_CONFIG_DIR=${pwd(tmp: true)}/azure", "DOCKER_CONFIG=${pwd(tmp: true)}/docker"]) {
            sh '''
                set +x
                set -eu
                trap 'az logout >/dev/null 2>&1 || true' EXIT
                az login --service-principal --username "$AZURE_CLIENT_ID" \
                    --password "$AZURE_CLIENT_SECRET" --tenant "$AZURE_TENANT_ID" --output none
                az account set --subscription "$AZURE_SUBSCRIPTION_ID"
            ''' + comandos
        }
    }
}

pipeline {
    agent none
    options {
        timeout(time: 2, unit: 'DAYS')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
        skipStagesAfterUnstable()
    }
    parameters {
        string(name: 'ACR_NAME', defaultValue: 'carpartsacr', description: 'Nome do ACR existente')
        string(name: 'RESOURCE_GROUP', defaultValue: 'rg-carparts', description: 'Grupo de recursos Azure')
        string(name: 'HML_APP', defaultValue: 'carparts-api-hml', description: 'Container App de homologacao')
        string(name: 'PROD_APP', defaultValue: 'carparts-api-prod', description: 'Container App de producao')
        string(name: 'APP_DOCKERFILE', defaultValue: 'docker/Dockerfile', description: 'Dockerfile da API no repositorio')
    }
    environment {
        APP = 'carparts-api'
        REGISTRY = "${params.ACR_NAME}.azurecr.io"
        TAG = "${env.BUILD_NUMBER}"
        CI = 'true'
    }
    stages {
        stage('Qualidade') {
            agent {
                docker {
                    image 'node:22-alpine'
                    label 'linux && docker'
                }
            }
            options { timeout(time: 15, unit: 'MINUTES') }
            environment { npm_config_cache = "${env.WORKSPACE}/.npm" }
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm test'
            }
            post {
                always { junit testResults: 'reports/*.xml' }
            }
        }
        stage('Imagem e registro') {
            agent { label 'linux && docker' }
            options { timeout(time: 20, unit: 'MINUTES') }
            stages {
                stage('Build da imagem') {
                    steps {
                        sh 'docker build -f "$APP_DOCKERFILE" -t "$REGISTRY/$APP:$TAG" .'
                    }
                }
                stage('Publicacao no ACR') {
                    when { branch 'main' }
                    steps {
                        executarAzure('''
                            trap 'docker logout "$REGISTRY" >/dev/null 2>&1 || true; az logout >/dev/null 2>&1 || true' EXIT
                            az acr login --name "$ACR_NAME"
                            docker push "$REGISTRY/$APP:$TAG"
                        ''')
                    }
                }
            }
        }
        stage('Deploy homologacao') {
            when { beforeAgent true; branch 'main' }
            agent { label 'linux && docker' }
            options { timeout(time: 15, unit: 'MINUTES') }
            steps {
                executarAzure('''
                    az containerapp update --name "$HML_APP" --resource-group "$RESOURCE_GROUP" \
                        --image "$REGISTRY/$APP:$TAG" --output none
                    HOST=$(az containerapp show --name "$HML_APP" --resource-group "$RESOURCE_GROUP" \
                        --query properties.configuration.ingress.fqdn --output tsv)
                    test -n "$HOST"
                    curl --fail --show-error --retry 12 --retry-all-errors --retry-delay 10 \
                        --connect-timeout 10 --max-time 30 "https://$HOST/health"
                ''')
            }
        }
        stage('Aprovacao') {
            when { branch 'main' }
            steps {
                timeout(time: 1, unit: 'DAYS') {
                    script {
                        def aprovador = input(message: "Publicar ${APP}:${TAG} em producao?",
                            ok: 'Aprovar', submitter: 'admin', submitterParameter: 'APROVADOR')
                        echo "Aprovado por ${aprovador}; imagem ${REGISTRY}/${APP}:${TAG}"
                    }
                }
            }
        }
        stage('Deploy producao') {
            when { beforeAgent true; branch 'main' }
            agent { label 'linux && docker' }
            options { timeout(time: 15, unit: 'MINUTES') }
            steps {
                executarAzure('''
                    az containerapp update --name "$PROD_APP" --resource-group "$RESOURCE_GROUP" \
                        --image "$REGISTRY/$APP:$TAG" --output none
                ''')
            }
        }
    }
    post {
        success { echo "Pipeline concluido: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }
        failure { echo "Pipeline falhou. Consulte ${env.BUILD_URL}" }
        aborted { echo 'Pipeline cancelado ou prazo de aprovacao esgotado.' }
    }
}
