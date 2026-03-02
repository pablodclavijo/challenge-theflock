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
        primaryKey: true
      },
      fullName: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(256),
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "application_users",
      modelName: "ApplicationUser",
      timestamps: false
    }
  );

  return ApplicationUser;
};
