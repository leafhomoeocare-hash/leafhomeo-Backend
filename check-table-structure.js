// Check blog table structure
const sequelize = require('./config/database');

async function checkTable() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\nChecking table structure...');
    const tableInfo = await sequelize.getQueryInterface().describeTable('blogs');
    console.log('Table structure:', JSON.stringify(tableInfo, null, 2));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();
