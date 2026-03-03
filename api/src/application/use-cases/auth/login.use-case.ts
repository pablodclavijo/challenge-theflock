import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IRoleRepository } from "../../../domain/repositories/role.repository";
import { IJwtService } from "../../ports/jwt.port";
import { LoginRequestDto, AuthResponseDto } from "../../dtos/auth.dto";
import { UnauthorizedError, ForbiddenError } from "../../../shared/errors/AppError";
import { verifyPassword } from "../../../infrastructure/auth/aspnet-identity-hasher";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
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

    const userRoleNames = await this.userRepository.getUserRoleNames(user.id);
    const hasCompradorRole = userRoleNames.includes("Comprador");
    if (!hasCompradorRole) {
      throw new ForbiddenError("Access restricted to buyers");
    }

    const compradorRoleId = await this.roleRepository.findIdByName("Comprador");
    if (!compradorRoleId) {
      throw new Error("Comprador role not found in database");
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roleId: compradorRoleId
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
