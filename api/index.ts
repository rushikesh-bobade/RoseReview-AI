import { buildApp } from '../apps/api/src/app';

const app = buildApp();

export default async function (req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}
