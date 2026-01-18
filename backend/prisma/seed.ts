import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Check if database is accessible
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Count existing records
    const userCount = await prisma.user.count()
    const listCount = await prisma.list.count()
    const recipeCount = await prisma.recipe.count()

    console.log(`📊 Database stats:`)
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Lists: ${listCount}`)
    console.log(`   - Recipes: ${recipeCount}`)

    // Note: This seed file is minimal because SousChefy creates users
    // through the authentication flow. No initial data is required.
    console.log('✅ Seed completed successfully')
  } catch (error) {
    console.error('❌ Error during seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
