import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class OrderItem extends Model<InferAttributes<OrderItem>, InferCreationAttributes<OrderItem>> {
  declare id: CreationOptional<number>;
  declare orderId: number;
  declare productId: number;
  declare productNameSnapshot: string;
  declare unitPriceSnapshot: number;
  declare quantity: number;
  declare lineTotal: number;
}

export const initOrderItemModel = (sequelize: Sequelize): typeof OrderItem => {
  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        field: "Id"
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "OrderId"
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ProductId"
      },
      productNameSnapshot: {
        type: DataTypes.STRING(180),
        allowNull: false,
        field: "ProductNameSnapshot"
      },
      unitPriceSnapshot: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "UnitPriceSnapshot"
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        },
        field: "Quantity"
      },
      lineTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "LineTotal"
      }
    },
    {
      sequelize,
      tableName: "OrderItems",
      modelName: "OrderItem",
      timestamps: false
    }
  );

  return OrderItem;
};
