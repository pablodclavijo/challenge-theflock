import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../../infrastructure/auth/jwt.service";
import { JwtPayload } from "../../../application/ports/jwt.port";
import { UnauthorizedError, ForbiddenError } from "../../../shared/errors/AppError";
import { COMPRADOR_ROLE_ID } from "../../../shared/constants";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const jwtService = new JwtService();

/**
 * Verifies the Bearer JWT in the Authorization header and attaches the
 * decoded payload to `req.user`.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwtService.verify(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Ensures the authenticated user has the Comprador role.
 * Must be used after `authenticate`.
 */
export function requireComprador(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.roleId !== COMPRADOR_ROLE_ID) {
    return next(new ForbiddenError("Access restricted to buyers"));
  }
  next();
}
