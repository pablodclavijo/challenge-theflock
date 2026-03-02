import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IJwtService } from "../../ports/jwt.port";
import { LoginRequestDto, AuthResponseDto } from "../../dtos/auth.dto";
import { UnauthorizedError, ForbiddenError } from "../../../shared/errors/AppError";
import { verifyPassword } from "../../../infrastructure/auth/aspnet-identity-hasher";
import { COMPRADOR_ROLE_ID } from "../../../shared/constants";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByNormalizedEmail(
      dto.email.toUpperCase()
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is disabled");
    }

    const passwordValid = verifyPassword(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isComprador = await this.userRepository.hasRole(user.id, COMPRADOR_ROLE_ID);
    if (!isComprador) {
      throw new ForbiddenError("Access restricted to buyers");
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roleId: COMPRADOR_ROLE_ID
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        shippingAddress: user.shippingAddress
      }
    };
  }
}
