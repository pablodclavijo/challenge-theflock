import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../../infrastructure/auth/jwt.service";
import { JwtPayload } from "../../../application/ports/jwt.port";
import { UnauthorizedError, ForbiddenError } from "../../../shared/errors/AppError";
import { IRoleRepository } from "../../../domain/repositories/role.repository";

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
 * Creates middleware to ensure the authenticated user has the Comprador role.
 * Must be used after `authenticate`.
 * @param roleRepository The role repository to fetch the Comprador role ID
 */
export function createRequireCompradorMiddleware(roleRepository: IRoleRepository) {
  let compradorRoleId: string | null = null;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch the Comprador role ID once on first use (cached)
      if (!compradorRoleId) {
        compradorRoleId = await roleRepository.findIdByName("Comprador");
        if (!compradorRoleId) {
          throw new Error("Comprador role not found in database");
        }
      }

      if (req.user?.roleId !== compradorRoleId) {
        return next(new ForbiddenError("Access restricted to buyers"));
      }
      next();
    } catch (err) {
      next(err);
    }
  };}