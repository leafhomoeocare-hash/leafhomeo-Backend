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

async function removePdfFields() {
  try {
    console.log('Starting PDF fields removal migration...');

    // Remove pdfGenerated column
    await sequelize.getQueryInterface().removeColumn('consultations', 'pdfGenerated');
    console.log('✅ pdfGenerated column removed');

    // Remove pdfPath column
    await sequelize.getQueryInterface().removeColumn('consultations', 'pdfPath');
    console.log('✅ pdfPath column removed');

    console.log('✅ PDF fields removed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removePdfFields();
