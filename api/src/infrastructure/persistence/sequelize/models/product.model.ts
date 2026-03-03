import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class Product extends Model<InferAttributes<Product>, InferCreationAttributes<Product>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string;
  declare price: number;
  declare stock: number;
  declare categoryId: number;
  declare imageUrl: string | null;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const initProductModel = (sequelize: Sequelize): typeof Product => {
  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        field: "Id"
      },
      name: {
        type: DataTypes.STRING(180),
        allowNull: false,
        field: "Name"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "Description"
      },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "Price"
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "Stock"
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "CategoryId"
      },
      imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "ImageUrl"
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
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "UpdatedAt"
      }
    },
    {
      sequelize,
      tableName: "Products",
      modelName: "Product",
      timestamps: false
    }
  );

  return Product;
};
