import { randomUUID } from "crypto";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import { UpdateProfileDto, ProfileResponseDto } from "../../dtos/user.dto";
import { NotFoundError } from "../../../shared/errors/AppError";

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const patch: Parameters<IUserRepository["update"]>[1] = {
      concurrencyStamp: randomUUID()
    };
    if (dto.fullName !== undefined) patch.fullName = dto.fullName;
    if (dto.shippingAddress !== undefined) patch.shippingAddress = dto.shippingAddress;

    await this.userRepository.update(userId, patch);

    // Re-fetch to return the persisted state
    const updated = await this.userRepository.findById(userId);

    return {
      id: updated!.id,
      email: updated!.email,
      fullName: updated!.fullName,
      shippingAddress: updated!.shippingAddress
    };
  }
}
