import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const sensitiveFiles = [
  resolve('apps/web/dist/api/config/config.local.php'),
  resolve('apps/web/dist/prodisa-config.php'),
];

for (const file of sensitiveFiles) {
  await rm(file, { force: true });
}

console.log('Build seguro: archivos de configuración privada excluidos de dist.');
