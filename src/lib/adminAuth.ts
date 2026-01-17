import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminUser {
  username: string;
  role: string;
}

export function verifyAdminToken(req: NextApiRequest): AdminUser | null {
  const token = req.cookies.admin_token;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function withAdminAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AdminUser) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = verifyAdminToken(req);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
    }

    return handler(req, res, user);
  };
}
