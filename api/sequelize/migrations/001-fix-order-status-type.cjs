'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop the existing Status column if it exists
      await queryInterface.removeColumn('Orders', 'Status');
    } catch (error) {
      console.log('Status column does not exist or could not be dropped');
    }

    // Create the ENUM type for OrderStatus
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN
          CREATE TYPE enum_orders_status AS ENUM ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Paid', 'PaymentFailed');
        END IF;
      END
      $$;
    `);

    // Add the Status column with ENUM type and default value
    await queryInterface.addColumn('Orders', 'Status', {
      type: Sequelize.ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Paid', 'PaymentFailed'),
      allowNull: false,
      defaultValue: 'Pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the Status column
    await queryInterface.removeColumn('Orders', 'Status');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS enum_orders_status;`);
  }
};
