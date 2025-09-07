import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const clients = new Set<any>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n');

    const client = res;
    clients.add(client);

    // Handle client disconnect
    req.on('close', () => {
      clients.delete(client);
    });

    // Keep the connection alive
    const keepAlive = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Make clients available globally for sending updates
declare global {
  var sseClients: Set<any>;
}

global.sseClients = clients;