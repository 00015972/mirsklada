/**
 * Tenant Controller
 * HTTP handlers for tenant operations
 */
import { Request, Response, NextFunction } from "express";
import { tenantService } from "./tenant.service";

export class TenantController {
  /**
   * GET /tenants - List user's tenants
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await tenantService.findAllForUser(req.userId!);
      res.json({ tenants });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tenants/:id - Get tenant details
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.findById(
        req.params.id as string,
        req.userId!,
      );
      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tenants - Create new tenant
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.create(req.userId!, req.body);
      res.status(201).json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /tenants/:id - Update tenant
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.update(
        req.params.id as string,
        req.userId!,
        req.body,
      );
      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tenants/:id - Delete tenant
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tenantService.delete(
        req.params.id as string,
        req.userId!,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tenants/:id/members - List tenant members
   */
  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await tenantService.getMembers(
        req.params.id as string,
        req.userId!,
      );
      res.json({ members });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tenants/:id/members - Invite member
   */
  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await tenantService.inviteMember(
        req.params.id as string,
        req.userId!,
        req.body,
      );
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /tenants/:id/members/:memberId - Update member role
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await tenantService.updateMemberRole(
        req.params.id as string,
        req.params.memberId as string,
        req.userId!,
        req.body.role,
      );
      res.json({ member });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tenants/:id/members/:memberId - Remove member
   */
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tenantService.removeMember(
        req.params.id as string,
        req.params.memberId as string,
        req.userId!,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const tenantController = new TenantController();
