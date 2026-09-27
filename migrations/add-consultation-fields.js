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

async function addConsultationFields() {
  try {
    console.log('Starting consultation fields migration...');

    // Add new columns to consultations table
    await sequelize.getQueryInterface().addColumn('consultations', 'chiefComplaints', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'appetite', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'thirst', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'desire', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'aversion', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'habits', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'stool', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'urine', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'perspiration', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'menWomen', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'sleep', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'dream', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'thermal', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'amelioration', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'aggravation', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'otherComplaints', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'levelsOfHealth', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'perception', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await sequelize.getQueryInterface().addColumn('consultations', 'screenshots', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Remove extra fields that were already in the model
    await sequelize.getQueryInterface().removeColumn('consultations', 'notes');
    console.log('✅ notes column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'diagnosis');
    console.log('✅ diagnosis column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'prescription');
    console.log('✅ prescription column removed');

    await sequelize.getQueryInterface().removeColumn('consultations', 'followUpDate');
    console.log('✅ followUpDate column removed');

    console.log('✅ Consultation fields added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addConsultationFields();
