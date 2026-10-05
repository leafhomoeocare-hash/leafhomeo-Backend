// Fix blog table: rename content column to description
const sequelize = require('./config/database');

async function fixBlogColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\nRenaming content column to description...');
    await sequelize.getQueryInterface().renameColumn('blogs', 'content', 'description');
    console.log('✅ Column renamed successfully');

    console.log('\n✅ Blog table fixed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('column "content" does not exist')) {
      console.log('Column "content" does not exist. Maybe already renamed or never existed.');
    }
    process.exit(1);
  }
}

fixBlogColumn();
