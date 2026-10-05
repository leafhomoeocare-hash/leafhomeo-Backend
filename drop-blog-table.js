// Drop old blogs table and recreate with new schema
const sequelize = require('./config/database');
const Blog = require('./models/Blog');

async function dropAndRecreate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\nDropping old blogs table with SQL...');
    await sequelize.query(`DROP TABLE IF EXISTS "blogs" CASCADE`);
    console.log('✅ Old table dropped');

    console.log('\nDropping old enum type if exists...');
    await sequelize.query(`DROP TYPE IF EXISTS "enum_blogs_blogType" CASCADE`);
    console.log('✅ Old enum type dropped');

    console.log('\nCreating new blogs table...');
    await Blog.sync({ force: true });
    console.log('✅ New table created');

    console.log('\n✅ Blog table recreated with new schema!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropAndRecreate();
