# Create New API Endpoint

Create a new Express API endpoint following the mirsklada patterns.

## Requirements
- Use the controller/service/routes pattern from `api-patterns.skill.md`
- Include Zod validation schema in `@mirsklada/shared`
- Add tenant isolation (always filter by `tenantId`)
- Use `asyncHandler` wrapper for error handling
- Return standardized JSON responses

## I need:
1. **Module name**: (e.g., "products", "clients", "orders")
2. **Operations**: (e.g., "CRUD", "list only", "custom action")
3. **Related entities**: (what database tables are involved?)

## Generate:
- [ ] Zod schema in `packages/shared/src/schemas/`
- [ ] Service in `apps/api/src/modules/{module}/{module}.service.ts`
- [ ] Controller in `apps/api/src/modules/{module}/{module}.controller.ts`
- [ ] Routes in `apps/api/src/modules/{module}/{module}.routes.ts`
- [ ] Basic test file
