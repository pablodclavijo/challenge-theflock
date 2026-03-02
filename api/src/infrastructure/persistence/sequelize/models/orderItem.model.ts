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
        allowNull: false
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      productNameSnapshot: {
        type: DataTypes.STRING(180),
        allowNull: false
      },
      unitPriceSnapshot: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      lineTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: "order_items",
      modelName: "OrderItem",
      timestamps: false
    }
  );

  return OrderItem;
};
