import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class AspNetUserRole extends Model<
  InferAttributes<AspNetUserRole>,
  InferCreationAttributes<AspNetUserRole>
> {
  declare UserId: string;
  declare RoleId: string;
}

export const initAspNetUserRoleModel = (sequelize: Sequelize): typeof AspNetUserRole => {
  AspNetUserRole.init(
    {
      UserId: { type: DataTypes.STRING(450), allowNull: false, primaryKey: true },
      RoleId: { type: DataTypes.STRING(450), allowNull: false, primaryKey: true }
    },
    {
      sequelize,
      tableName: "AspNetUserRoles",
      modelName: "AspNetUserRole",
      timestamps: false
    }
  );

  return AspNetUserRole;
};
