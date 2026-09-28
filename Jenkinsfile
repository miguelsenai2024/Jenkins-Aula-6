def azure(String comandos, boolean captura = false) {
    withCredentials([
        usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZURE_CLIENT_ID', passwordVariable: 'AZURE_CLIENT_SECRET'),
        string(credentialsId: 'azure-tenant', variable: 'AZURE_TENANT_ID'),
        string(credentialsId: 'azure-subscription', variable: 'AZURE_SUBSCRIPTION_ID')
    ]) {
        withEnv(["AZURE_CONFIG_DIR=${pwd(tmp: true)}/azure", "DOCKER_CONFIG=${pwd(tmp: true)}/docker"]) {
            return sh(returnStdout: captura, script: '''
                set +x
                set -eu
                trap 'docker logout "$REGISTRY" >/dev/null 2>&1 || true; az logout >/dev/null 2>&1 || true' EXIT
                az login --service-principal --username "$AZURE_CLIENT_ID" \
                    --password "$AZURE_CLIENT_SECRET" --tenant "$AZURE_TENANT_ID" --output none
                az account set --subscription "$AZURE_SUBSCRIPTION_ID"
            ''' + comandos)
        }
    }
}

pipeline {
    agent none
    options {
        timeout(time: 2, unit: 'DAYS')
        buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '30'))
        disableConcurrentBuilds()
        skipStagesAfterUnstable()
        timestamps()
    }
    parameters {
        booleanParam(name: 'DEPLOY_AZURE', defaultValue: false, description: 'Habilitar CD nos recursos Azure ja configurados (somente main)')
        string(name: 'ACR_NAME', defaultValue: 'carpartsacr', description: 'Nome do ACR existente')
        string(name: 'RESOURCE_GROUP', defaultValue: 'rg-carparts', description: 'Grupo de recursos Azure')
        string(name: 'HML_APP', defaultValue: 'carparts-api-hml', description: 'Container App de homologacao')
        string(name: 'PROD_APP', defaultValue: 'carparts-api-prod', description: 'Container App de producao')
    }
    environment {
        APP = 'carparts-api'
        REGISTRY = "${params.ACR_NAME}.azurecr.io"
        CI = 'true'
    }
    stages {
        stage('CI') {
            agent { label 'linux && docker' }
            options { timeout(time: 20, unit: 'MINUTES') }
            stages {
                stage('Qualidade') {
                    steps {
                        script {
                            env.SOURCE_COMMIT = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                            env.COMMIT_EPOCH = sh(returnStdout: true, script: 'git show -s --format=%ct HEAD').trim()
                            env.TAG = "${env.BUILD_NUMBER}-${env.SOURCE_COMMIT.take(12)}"
                            env.IMAGE_TAG = "${env.REGISTRY}/${env.APP}:${env.TAG}"
                        }
                        dir('api') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm test'
                        }
                    }
                    post { always { junit testResults: 'api/reports/*.xml' } }
                }
                stage('Build da imagem') {
                    steps {
                        sh 'docker build --build-arg BUILD_COMMIT="$SOURCE_COMMIT" --build-arg APP_VERSION="$TAG" -t "$IMAGE_TAG" api'
                        sh '''
                            set -eu
                            CONTAINER="smoke-$BUILD_NUMBER-$(date +%s)"
                            trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT
                            docker run -d --name "$CONTAINER" "$IMAGE_TAG"
                            docker exec "$CONTAINER" node --input-type=module -e '
                                for(let attempt=0;attempt<30;attempt++) {
                                    try {
                                        const r=await fetch("http://localhost:3000/health");
                                        const body=await r.json();
                                        if(!r.ok || body.commit!==process.env.BUILD_COMMIT) throw Error("Artefato inesperado");
                                        console.log(JSON.stringify(body)); process.exit(0);
                                    } catch(e) { if(attempt===29) throw e; await new Promise(r=>setTimeout(r,1000)); }
                                }'
                        '''
                    }
                }
                stage('Publicacao no ACR') {
                    when { allOf { branch 'main'; expression { params.DEPLOY_AZURE }; not { changeRequest() } } }
                    steps {
                        azure('''
                            az acr login --name "$ACR_NAME"
                            docker push "$IMAGE_TAG"
                        ''')
                        script {
                            env.IMAGE_REF = sh(returnStdout: true, script: "docker inspect --format='{{index .RepoDigests 0}}' \"\$IMAGE_TAG\"").trim()
                            if (!env.IMAGE_REF.contains('@sha256:')) { error('Digest nao encontrado') }
                        }
                    }
                }
            }
        }
        stage('Deploy homologacao') {
            when { beforeAgent true; allOf { branch 'main'; expression { params.DEPLOY_AZURE }; not { changeRequest() } } }
            agent { label 'linux && docker' }
            options { timeout(time: 15, unit: 'MINUTES') }
            steps {
                azure('''
                    az containerapp update --name "$HML_APP" --resource-group "$RESOURCE_GROUP" --image "$IMAGE_REF" --output none
                    HOST=$(az containerapp show --name "$HML_APP" --resource-group "$RESOURCE_GROUP" \
                        --query properties.configuration.ingress.fqdn --output tsv)
                    test -n "$HOST"
                    node scripts/smoke.mjs "https://$HOST/health" "$SOURCE_COMMIT" "$TAG"
                ''')
            }
        }
        stage('Aprovacao') {
            when { allOf { branch 'main'; expression { params.DEPLOY_AZURE }; not { changeRequest() } } }
            steps {
                timeout(time: 1, unit: 'DAYS') {
                    script {
                        env.APPROVER = input(message: "Publicar ${env.IMAGE_REF} em producao?",
                            ok: 'Aprovar', submitter: 'admin', submitterParameter: 'APROVADOR')
                        env.APPROVED_AT = java.time.Instant.now().toString()
                        echo "Aprovacao registrada: ${env.APPROVER}, ${env.APPROVED_AT}, commit ${env.SOURCE_COMMIT}"
                    }
                }
            }
        }
        stage('Deploy producao') {
            when { beforeAgent true; allOf { branch 'main'; expression { params.DEPLOY_AZURE }; not { changeRequest() } } }
            agent { label 'linux && docker' }
            options { timeout(time: 15, unit: 'MINUTES') }
            steps {
                azure('''
                    az containerapp update --name "$PROD_APP" --resource-group "$RESOURCE_GROUP" --image "$IMAGE_REF" --output none
                    HOST=$(az containerapp show --name "$PROD_APP" --resource-group "$RESOURCE_GROUP" \
                        --query properties.configuration.ingress.fqdn --output tsv)
                    node scripts/smoke.mjs "https://$HOST/health" "$SOURCE_COMMIT" "$TAG"
                ''')
                sh 'node scripts/release.mjs'
                archiveArtifacts artifacts: 'release.json', fingerprint: true
            }
        }
    }
    post {
        success { echo "Concluido: ${env.JOB_NAME} #${env.BUILD_NUMBER}; deploy Azure habilitado=${params.DEPLOY_AZURE}" }
        failure { echo "Falha: ${env.BUILD_URL}" }
        aborted { echo 'Cancelado ou prazo de aprovacao esgotado.' }
    }
}
