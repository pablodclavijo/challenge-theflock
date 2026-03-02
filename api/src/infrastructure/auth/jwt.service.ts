import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { IJwtService, JwtPayload } from "../../application/ports/jwt.port";
import { UnauthorizedError } from "../../shared/errors/AppError";

export class JwtService implements IJwtService {
  sign(payload: JwtPayload): string {
    const { iat: _iat, exp: _exp, ...claims } = payload;
    return jwt.sign(claims, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"]
    });
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.jwt.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
