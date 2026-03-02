export interface JwtPayload {
  sub: string;      // user ID
  email: string;
  roleId: string;
  iat?: number;
  exp?: number;
}

export interface IJwtService {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
}
