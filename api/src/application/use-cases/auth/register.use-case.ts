import { randomUUID } from "crypto";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IRoleRepository } from "../../../domain/repositories/role.repository";
import { IJwtService } from "../../ports/jwt.port";
import { RegisterRequestDto, AuthResponseDto } from "../../dtos/auth.dto";
import { ConflictError } from "../../../shared/errors/AppError";
import { hashPassword } from "../../../infrastructure/auth/aspnet-identity-hasher";

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly jwtService: IJwtService
  ) {}

  async execute(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findByNormalizedEmail(
      dto.email.toUpperCase()
    );

    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const compradorRoleId = await this.roleRepository.findIdByName("Comprador");
    if (!compradorRoleId) {
      throw new Error("Comprador role not found in database");
    }

    const id = randomUUID();
    const normalizedEmail = dto.email.toUpperCase();
    const normalizedUserName = dto.email.toUpperCase();

    const user = await this.userRepository.create({
      id,
      email: dto.email,
      normalizedEmail,
      userName: dto.email,
      normalizedUserName,
      fullName: dto.fullName,
      passwordHash: hashPassword(dto.password),
      shippingAddress: dto.shippingAddress ?? null,
      isActive: true,
      emailConfirmed: false,
      securityStamp: randomUUID(),
      concurrencyStamp: randomUUID()
    });

    await this.userRepository.assignRole(user.id, compradorRoleId);

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
