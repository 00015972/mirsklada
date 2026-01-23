/**
 * Tenant Routes
 */
import { Router, type Router as RouterType } from "express";
import { tenantController } from "./tenant.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantIdParamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "./tenant.schemas";

const router: RouterType = Router();

// Tenant CRUD
router.get("/", tenantController.list.bind(tenantController));
router.get(
  "/:id",
  validate(tenantIdParamSchema),
  tenantController.get.bind(tenantController),
);
router.post(
  "/",
  validate(createTenantSchema),
  tenantController.create.bind(tenantController),
);
router.patch(
  "/:id",
  validate(updateTenantSchema),
  tenantController.update.bind(tenantController),
);
router.delete(
  "/:id",
  validate(tenantIdParamSchema),
  tenantController.delete.bind(tenantController),
);

// Member management
router.get(
  "/:id/members",
  validate(tenantIdParamSchema),
  tenantController.listMembers.bind(tenantController),
);
router.post(
  "/:id/members",
  validate(inviteMemberSchema),
  tenantController.inviteMember.bind(tenantController),
);
router.patch(
  "/:id/members/:memberId",
  validate(updateMemberRoleSchema),
  tenantController.updateMemberRole.bind(tenantController),
);
router.delete(
  "/:id/members/:memberId",
  tenantController.removeMember.bind(tenantController),
);

export { router as tenantRoutes };
