import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class ApplicationUser extends Model<InferAttributes<ApplicationUser>, InferCreationAttributes<ApplicationUser>> {
  declare id: CreationOptional<string>;
  declare fullName: string;
  declare email: string;
  declare passwordHash: string;
  declare shippingAddress: string | null;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
}

export const initApplicationUserModel = (sequelize: Sequelize): typeof ApplicationUser => {
  ApplicationUser.init(
    {
      id: {
        type: DataTypes.STRING(450),
        allowNull: false,
        primaryKey: true,
        field: "Id"
      },
      fullName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: "FullName"
      },
      email: {
        type: DataTypes.STRING(256),
        allowNull: false,
        unique: true,
        field: "Email"
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "PasswordHash"
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "ShippingAddress"
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "IsActive"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "CreatedAt"
      }
    },
    {
      sequelize,
      tableName: "ApplicationUsers",
      modelName: "ApplicationUser",
      timestamps: false
    }
  );

  return ApplicationUser;
};
