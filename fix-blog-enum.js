// Fix blogType column to ENUM
const sequelize = require('./config/database');

async function fixBlogEnum() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('\nChecking blogType column type...');
    const tableInfo = await sequelize.getQueryInterface().describeTable('blogs');
    console.log('Current blogType type:', tableInfo.blogType?.type);

    console.log('\nDropping old enum type if exists with CASCADE...');
    try {
      await sequelize.query(`DROP TYPE IF EXISTS "enum_blogs_blogType" CASCADE`);
      console.log('✅ Old enum type dropped');
    } catch (e) {
      console.log('No old enum type found');
    }

    console.log('\nCreating new enum type...');
    await sequelize.query(`CREATE TYPE "enum_blogs_blogType" AS ENUM ('patient', 'doctor', 'all')`);
    console.log('✅ Enum type created');

    console.log('\nConverting blogType column to enum...');
    await sequelize.query(`ALTER TABLE "blogs" ALTER COLUMN "blogType" TYPE "enum_blogs_blogType" USING "blogType"::"enum_blogs_blogType"`);
    console.log('✅ blogType column converted to enum');

    console.log('\nAdding comment...');
    await sequelize.query(`COMMENT ON COLUMN "blogs"."blogType" IS 'Who can view this blog: patient, doctor, or all'`);
    console.log('✅ Comment added');

    console.log('\n✅ Blog table enum fixed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixBlogEnum();
