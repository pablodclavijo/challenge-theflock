import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";
import { OrderStatus } from "../../../../domain/enums/order-status";

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>;
  declare userId: string;
  declare status: CreationOptional<OrderStatus>;
  declare subtotal: number;
  declare tax: number;
  declare total: number;
  declare shippingAddress: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export const initOrderModel = (sequelize: Sequelize): typeof Order => {
  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.STRING(450),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
        defaultValue: OrderStatus.Pending
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: "orders",
      modelName: "Order",
      timestamps: false
    }
  );

  return Order;
};
