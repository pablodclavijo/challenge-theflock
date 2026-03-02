import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

/**
 * Maps to the ASP.NET Identity AspNetUsers table.
 * Table and column names use EF Core / Npgsql snake_case convention.
 * Adjust `tableName` and field `field` options if your .NET side uses different casing.
 */
export class AspNetUser extends Model<
  InferAttributes<AspNetUser>,
  InferCreationAttributes<AspNetUser>
> {
  declare Id: string;
  declare UserName: string | null;
  declare NormalizedUserName: string | null;
  declare Email: string | null;
  declare NormalizedEmail: string | null;
  declare EmailConfirmed: boolean;
  declare PasswordHash: string | null;
  declare SecurityStamp: string | null;
  declare ConcurrencyStamp: string | null;
  declare PhoneNumber: string | null;
  declare PhoneNumberConfirmed: boolean;
  declare TwoFactorEnabled: boolean;
  declare LockoutEnd: Date | null;
  declare LockoutEnabled: boolean;
  declare AccessFailedCount: number;
  // Custom ApplicationUser fields
  declare FullName: string;
  declare ShippingAddress: string | null;
  declare IsActive: CreationOptional<boolean>;
  declare CreatedAt: CreationOptional<Date>;
}

export const initAspNetUserModel = (sequelize: Sequelize): typeof AspNetUser => {
  AspNetUser.init(
    {
      Id: {
        type: DataTypes.STRING(450),
        allowNull: false,
        primaryKey: true
      },
      UserName: { type: DataTypes.STRING(256), allowNull: true },
      NormalizedUserName: { type: DataTypes.STRING(256), allowNull: true },
      Email: { type: DataTypes.STRING(256), allowNull: true },
      NormalizedEmail: { type: DataTypes.STRING(256), allowNull: true },
      EmailConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      PasswordHash: { type: DataTypes.TEXT, allowNull: true },
      SecurityStamp: { type: DataTypes.TEXT, allowNull: true },
      ConcurrencyStamp: { type: DataTypes.TEXT, allowNull: true },
      PhoneNumber: { type: DataTypes.TEXT, allowNull: true },
      PhoneNumberConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      TwoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      LockoutEnd: { type: DataTypes.DATE, allowNull: true },
      LockoutEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      AccessFailedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      FullName: { type: DataTypes.STRING(200), allowNull: false },
      ShippingAddress: { type: DataTypes.TEXT, allowNull: true },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
      sequelize,
      tableName: "AspNetUsers",
      modelName: "AspNetUser",
      timestamps: false
    }
  );

  return AspNetUser;
};
