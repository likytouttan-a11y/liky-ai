import { handleApiRequest } from '../../server/api.ts';

export default async (req: Request) => handleApiRequest(req);

export const config = {
  path: '/api/*',
};
