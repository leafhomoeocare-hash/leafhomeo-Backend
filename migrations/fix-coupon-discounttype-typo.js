const { sequelize } = require('../config/database');

async function up() {
  try {
    // Check if the column with typo exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'coupons' 
      AND column_name = 'discodocuntType'
    `);

    if (results.length > 0) {
      console.log('Found typo column discodocuntType, renaming to discountType...');
      
      // Rename the column
      await sequelize.query(`
        ALTER TABLE coupons 
        RENAME COLUMN discodocuntType TO discountType
      `);
      
      console.log('✅ Successfully renamed discodocuntType to discountType');
    } else {
      console.log('No typo column found, migration not needed');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    // Revert the change
    await sequelize.query(`
      ALTER TABLE coupons 
      RENAME COLUMN discountType TO discodocuntType
    `);
    
    console.log('✅ Successfully reverted discountType to discodocuntType');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };