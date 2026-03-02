import { Sequelize } from "sequelize";
import { ApplicationUser, initApplicationUserModel } from "./applicationUser.model";
import { CartItem, initCartItemModel } from "./cartItem.model";
import { Category, initCategoryModel } from "./category.model";
import { OrderItem, initOrderItemModel } from "./orderItem.model";
import { Order, initOrderModel } from "./order.model";
import { Product, initProductModel } from "./product.model";

export const initModels = (sequelize: Sequelize): void => {
  initApplicationUserModel(sequelize);
  initCategoryModel(sequelize);
  initProductModel(sequelize);
  initCartItemModel(sequelize);
  initOrderModel(sequelize);
  initOrderItemModel(sequelize);

  Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
  Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

  ApplicationUser.hasMany(CartItem, { foreignKey: "userId", as: "cartItems" });
  CartItem.belongsTo(ApplicationUser, { foreignKey: "userId", as: "user" });

  Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
  CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  ApplicationUser.hasMany(Order, { foreignKey: "userId", as: "orders" });
  Order.belongsTo(ApplicationUser, { foreignKey: "userId", as: "user" });

  Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
  OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
  OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
};

export { ApplicationUser, CartItem, Category, Order, OrderItem, Product };
