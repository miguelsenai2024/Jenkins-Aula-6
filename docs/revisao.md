# Revisao por pull request

Cada alteracao deve partir de uma branch, gerar uma pull request para main e aguardar o check Jenkins CI. O Jenkins deve criar o item PR-numero e validar a revisao de merge com a main, nao somente a branch isolada.

O check executa qualidade, JUnit, build Docker e smoke test da imagem. DEPLOY_AZURE fica falso no laboratorio de PR; o Jenkinsfile tambem impede CD quando changeRequest() e verdadeiro. Uma aprovacao de revisao de codigo nao substitui o input registrado antes do deploy de producao.

Esta pull request exercita a descoberta real de PR do proprio repositorio. O resultado verificavel aparece nos checks do GitHub e no artefato evidencias-jenkins do workflow associado. Sua existencia nao comprova que a main ja esteja protegida nem que haja um webhook publico persistente.

Antes de integrar: confirmar check verde, conferir os arquivos gerados e configurar a regra de protecao descrita em github.md. Depois da integracao, manter o historico da PR como evidencia de revisao e rastreabilidade.
