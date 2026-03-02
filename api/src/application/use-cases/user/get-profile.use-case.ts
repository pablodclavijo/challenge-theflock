import { IUserRepository } from "../../../domain/repositories/user.repository";
import { ProfileResponseDto } from "../../dtos/user.dto";
import { NotFoundError } from "../../../shared/errors/AppError";

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      shippingAddress: user.shippingAddress
    };
  }
}
