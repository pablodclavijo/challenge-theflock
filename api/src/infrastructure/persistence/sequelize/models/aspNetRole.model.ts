import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class AspNetRole extends Model<
  InferAttributes<AspNetRole>,
  InferCreationAttributes<AspNetRole>
> {
  declare Id: string;
  declare Name: string | null;
  declare NormalizedName: string | null;
  declare ConcurrencyStamp: string | null;
}

export const initAspNetRoleModel = (sequelize: Sequelize): typeof AspNetRole => {
  AspNetRole.init(
    {
      Id: { type: DataTypes.STRING(450), allowNull: false, primaryKey: true },
      Name: { type: DataTypes.STRING(256), allowNull: true },
      NormalizedName: { type: DataTypes.STRING(256), allowNull: true },
      ConcurrencyStamp: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      tableName: "AspNetRoles",
      modelName: "AspNetRole",
      timestamps: false
    }
  );

  return AspNetRole;
};
