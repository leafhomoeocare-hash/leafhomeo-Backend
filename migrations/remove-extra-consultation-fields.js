const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    timezone: '+05:30',
    dialectOptions: {}
  }
);

async function removeExtraFields() {
  try {
    console.log('Starting extra fields removal migration...');

    // Remove extra fields that were already in the model
    await sequelize.getQueryInterface().removeColumn('consultations', 'notes');
    console.log('✅ notes column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'diagnosis');
    console.log('✅ diagnosis column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'prescription');
    console.log('✅ prescription column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'followUpDate');
    console.log('✅ followUpDate column removed');

    console.log('✅ Extra fields removed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removeExtraFields();
