import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class Category extends Model<InferAttributes<Category>, InferCreationAttributes<Category>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
}

export const initCategoryModel = (sequelize: Sequelize): typeof Category => {
  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        field: "Id"
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        field: "Name"
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
      tableName: "Categories",
      modelName: "Category",
      timestamps: false
    }
  );

  return Category;
};
