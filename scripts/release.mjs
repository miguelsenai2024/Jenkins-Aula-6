import { writeFileSync } from 'node:fs';
const env = process.env;
for (const key of ['SOURCE_COMMIT', 'COMMIT_EPOCH', 'IMAGE_REF', 'APPROVER', 'APPROVED_AT']) {
  if (!env[key]) throw new Error(`Registro de entrega incompleto: ${key}`);
}
const deployedAt = new Date();
writeFileSync('release.json', JSON.stringify({
  commit: env.SOURCE_COMMIT, image: env.IMAGE_REF, approvedBy: env.APPROVER,
  approvedAt: env.APPROVED_AT, deployedAt: deployedAt.toISOString(),
  commitAt: new Date(Number(env.COMMIT_EPOCH) * 1000).toISOString(),
  leadTimeHours: (deployedAt.getTime() - Number(env.COMMIT_EPOCH) * 1000) / 3600000,
  build: env.BUILD_NUMBER, buildUrl: env.BUILD_URL
}, null, 2));
