# Create New Prisma Model

Create a new Prisma database model following the mirsklada patterns.

## Requirements
- MUST include `tenantId` field for multi-tenancy
- Use `@map("snake_case")` for database column names
- Use `@@map("table_name")` for table names
- Include `createdAt` and `updatedAt` timestamps
- Use `Decimal(10,2)` for weight fields
- Use `Decimal(14,2)` or `BigInt` for money fields
- Add appropriate indexes (always index `tenantId`)

## I need:
1. **Model name**: (e.g., "Product", "Client", "Order")
2. **Fields**: (list the business fields needed)
3. **Relations**: (which other models does it connect to?)

## Generate:
- [ ] Prisma model in `packages/database/prisma/schema.prisma`
- [ ] Migration command to run
- [ ] TypeScript types will be auto-generated
