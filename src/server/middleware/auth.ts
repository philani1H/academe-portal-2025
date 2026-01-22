import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('⚠ JWT_SECRET not found in environment variables (auth middleware). Authentication will fail.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number | string
    email: string
    role: string
    name?: string
    username?: string
  }
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers?.cookie || "";
  return header.split(";").reduce(
    (acc: Record<string, string>, part: string) => {
      const [key, ...v] = part.trim().split("=");
      if (!key) return acc;
      acc[key] = decodeURIComponent(v.join("="));
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response {
  const cookies = parseCookies(req);
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;

  // Helper to verify token and return decoded payload or null
  const verify = (token: string | undefined): any | null => {
    if (!token) return null;
    try {
      if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  };

  // Try to validate tokens in order of precedence: Header -> Admin Cookie -> Auth Cookie
  const decoded = verify(headerToken) || verify(cookies["admin_token"]) || verify(cookies["auth_token"]);

  if (decoded) {
    req.user = decoded;
    next();
  } else {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }
    next();
  };
}
