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
        allowNull: false,
        field: "Id"
      },
      userId: {
        type: DataTypes.STRING(450),
        allowNull: false,
        field: "UserId"
      },
      status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
        defaultValue: OrderStatus.Pending,
        field: "Status"
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "Subtotal"
      },
      tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "Tax"
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: "Total"
      },
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "ShippingAddress"
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
      tableName: "Orders",
      modelName: "Order",
      timestamps: false
    }
  );

  return Order;
};
