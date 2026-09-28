FROM jenkins/jenkins:2.568.3-jdk21

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
ENV CASC_JENKINS_CONFIG=/usr/share/jenkins/ref/casc.yaml

# Plugins no proprio Dockerfile para dispensar um arquivo plugins.txt.
RUN jenkins-plugin-cli --plugins \
    configuration-as-code workflow-aggregator git github-branch-source \
    docker-workflow pipeline-graph-view credentials-binding junit

COPY --chown=jenkins:jenkins casc.yaml /usr/share/jenkins/ref/casc.yaml
