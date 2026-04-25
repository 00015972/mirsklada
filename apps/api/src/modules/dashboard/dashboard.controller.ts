/**
 * Dashboard Controller
 * Provides aggregated metrics and analytics
 */
import { Router, Request, Response } from "express";
import { prisma, Prisma } from "@mirsklada/database";
import { requireFeature } from "../../middleware/subscription.middleware";

const router = Router();

// USD Exchange rate (you can make this dynamic later)
const USD_EXCHANGE_RATE = 12500; // 1 USD = 12,500 UZS

/**
 * Get date range based on period
 */
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to month
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

/**
 * GET /dashboard/metrics
 * Get main dashboard metrics
 */
router.get("/metrics", async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const period = (req.query.period as string) || "month";
  const { start, end } = getDateRange(period);

  try {
    // Get previous period for comparison
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevEnd = new Date(start);

    // Current period metrics
    const [
      totalRevenue,
      prevRevenue,
      totalOrders,
      prevOrders,
      totalDebt,
      lowStockCount,
      outOfStockCount,
      activeClients,
      totalProducts,
      totalStockValue,
    ] = await Promise.all([
      // Total revenue (paid amounts) - current period
      prisma.payment.aggregate({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      // Total revenue - previous period
      prisma.payment.aggregate({
        where: {
          tenantId,
          createdAt: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
      // Total orders - current period
      prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
          status: { not: "CANCELLED" },
        },
      }),
      // Total orders - previous period
      prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: prevStart, lte: prevEnd },
          status: { not: "CANCELLED" },
        },
      }),
      // Total outstanding debt
      prisma.client.aggregate({
        where: {
          tenantId,
          isActive: true,
        },
        _sum: { currentDebt: true },
      }),
      // Low stock products
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM products 
        WHERE tenant_id = ${tenantId} 
        AND is_active = true 
        AND min_stock_kg > 0 
        AND current_stock_kg <= min_stock_kg 
        AND current_stock_kg > 0
      `,
      // Out of stock products
      prisma.product.count({
        where: {
          tenantId,
          isActive: true,
          currentStockKg: { lte: 0 },
        },
      }),
      // Active clients (with orders in period)
      prisma.order.groupBy({
        by: ["clientId"],
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
        },
      }),
      // Total products
      prisma.product.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),
      // Total stock value (sum of currentStockKg * basePricePerKg)
      prisma.$queryRaw<[{ total: Prisma.Decimal | null }]>`
        SELECT SUM(current_stock_kg * base_price_per_kg)::decimal as total 
        FROM products 
        WHERE tenant_id = ${tenantId} AND is_active = true
      `,
    ]);

    // Calculate percentage changes
    const currentRevenue = Number(totalRevenue._sum.amount || 0);
    const previousRevenue = Number(prevRevenue._sum.amount || 0);
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const ordersChange =
      prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

    const debt = Number(totalDebt._sum.currentDebt || 0);
    const stockValue = Number(totalStockValue[0]?.total || 0);
    const lowStock = Number(lowStockCount[0]?.count || 0);

    res.json({
      data: {
        revenue: {
          amount: currentRevenue,
          amountUSD: Math.round(currentRevenue / USD_EXCHANGE_RATE),
          change: Math.round(revenueChange * 10) / 10,
          period,
        },
        debt: {
          amount: debt,
          amountUSD: Math.round(debt / USD_EXCHANGE_RATE),
        },
        orders: {
          count: totalOrders,
          change: Math.round(ordersChange * 10) / 10,
          period,
        },
        inventory: {
          totalProducts,
          lowStock,
          outOfStock: outOfStockCount,
          stockValue,
          stockValueUSD: Math.round(stockValue / USD_EXCHANGE_RATE),
        },
        clients: {
          active: activeClients.length,
        },
        exchangeRate: USD_EXCHANGE_RATE,
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: "Failed to load dashboard metrics" });
  }
});

/**
 * GET /dashboard/revenue-chart
 * Get revenue data for chart
 */
router.get(
  "/revenue-chart",
  requireFeature("reports_advanced"),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const period = (req.query.period as string) || "month";
    const { start, end } = getDateRange(period);

    try {
      // Determine grouping interval based on period
      let dateFormat: string;

      if (period === "today") {
        dateFormat = "HH24:00";
      } else if (period === "week" || period === "month") {
        dateFormat = "YYYY-MM-DD";
      } else {
        dateFormat = "YYYY-MM";
      }

      const revenueData = await prisma.$queryRaw<
        Array<{ date: string; revenue: Prisma.Decimal; orders: bigint }>
      >`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as date,
        COALESCE(SUM(amount), 0)::decimal as revenue,
        COUNT(*)::bigint as orders
      FROM payments
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${start}
        AND created_at <= ${end}
      GROUP BY date
      ORDER BY date ASC
    `;

      res.json({
        data: revenueData.map((row) => ({
          date: row.date,
          revenue: Number(row.revenue),
          orders: Number(row.orders),
        })),
      });
    } catch (error) {
      console.error("Revenue chart error:", error);
      res.status(500).json({ message: "Failed to load revenue chart data" });
    }
  },
);

/**
 * GET /dashboard/orders-by-status
 * Get orders grouped by status for pie chart
 */
router.get(
  "/orders-by-status",
  requireFeature("reports_advanced"),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const period = (req.query.period as string) || "month";
    const { start, end } = getDateRange(period);

    try {
      const ordersByStatus = await prisma.order.groupBy({
        by: ["status"],
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
        },
        _count: true,
      });

      res.json({
        data: ordersByStatus.map((row) => ({
          status: row.status,
          count: row._count,
        })),
      });
    } catch (error) {
      console.error("Orders by status error:", error);
      res.status(500).json({ message: "Failed to load orders by status" });
    }
  },
);

/**
 * GET /dashboard/payment-status
 * Get orders grouped by payment status for pie chart
 */
router.get(
  "/payment-status",
  requireFeature("reports_advanced"),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const period = (req.query.period as string) || "month";
    const { start, end } = getDateRange(period);

    try {
      const paymentStatus = await prisma.order.groupBy({
        by: ["paymentStatus"],
        where: {
          tenantId,
          createdAt: { gte: start, lte: end },
          status: { not: "CANCELLED" },
        },
        _count: true,
        _sum: { totalAmount: true },
      });

      res.json({
        data: paymentStatus.map((row) => ({
          status: row.paymentStatus,
          count: row._count,
          amount: Number(row._sum.totalAmount || 0),
        })),
      });
    } catch (error) {
      console.error("Payment status error:", error);
      res.status(500).json({ message: "Failed to load payment status" });
    }
  },
);

/**
 * GET /dashboard/top-products
 * Get top selling products
 */
router.get(
  "/top-products",
  requireFeature("reports_advanced"),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const period = (req.query.period as string) || "month";
    const { start, end } = getDateRange(period);
    const limit = parseInt(req.query.limit as string) || 5;

    try {
      const topProducts = await prisma.$queryRaw<
        Array<{
          product_id: string;
          product_name: string;
          total_quantity: Prisma.Decimal;
          total_revenue: Prisma.Decimal;
        }>
      >`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COALESCE(SUM(oi.quantity_kg), 0)::decimal as total_quantity,
        COALESCE(SUM(oi.line_total), 0)::decimal as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE p.tenant_id = ${tenantId}
        AND p.is_active = true
        AND (o.created_at >= ${start} AND o.created_at <= ${end} OR o.id IS NULL)
        AND (o.status != 'CANCELLED' OR o.id IS NULL)
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

      res.json({
        data: topProducts.map((row) => ({
          productId: row.product_id,
          productName: row.product_name,
          totalQuantity: Number(row.total_quantity),
          totalRevenue: Number(row.total_revenue),
        })),
      });
    } catch (error) {
      console.error("Top products error:", error);
      res.status(500).json({ message: "Failed to load top products" });
    }
  },
);

/**
 * GET /dashboard/top-clients
 * Get top clients by orders/debt
 */
router.get(
  "/top-clients",
  requireFeature("reports_advanced"),
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const period = (req.query.period as string) || "month";
    const { start, end } = getDateRange(period);
    const limit = parseInt(req.query.limit as string) || 5;
    const sortBy = (req.query.sortBy as string) || "revenue"; // 'revenue' or 'debt'

    try {
      if (sortBy === "debt") {
        // Top debtors
        const topDebtors = await prisma.client.findMany({
          where: {
            tenantId,
            isActive: true,
            currentDebt: { gt: 0 },
          },
          orderBy: { currentDebt: "desc" },
          take: limit,
          select: {
            id: true,
            name: true,
            currentDebt: true,
          },
        });

        res.json({
          data: topDebtors.map((client) => ({
            clientId: client.id,
            clientName: client.name,
            debt: Number(client.currentDebt),
          })),
        });
      } else {
        // Top by revenue
        const topClients = await prisma.$queryRaw<
          Array<{
            client_id: string;
            client_name: string;
            total_orders: bigint;
            total_revenue: Prisma.Decimal;
          }>
        >`
        SELECT 
          c.id as client_id,
          c.name as client_name,
          COUNT(DISTINCT o.id)::bigint as total_orders,
          COALESCE(SUM(o.total_amount), 0)::decimal as total_revenue
        FROM clients c
        LEFT JOIN orders o ON o.client_id = c.id
        WHERE c.tenant_id = ${tenantId}
          AND c.is_active = true
          AND (o.created_at >= ${start} AND o.created_at <= ${end} OR o.id IS NULL)
          AND (o.status != 'CANCELLED' OR o.id IS NULL)
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
        LIMIT ${limit}
      `;

        res.json({
          data: topClients.map((row) => ({
            clientId: row.client_id,
            clientName: row.client_name,
            totalOrders: Number(row.total_orders),
            totalRevenue: Number(row.total_revenue),
          })),
        });
      }
    } catch (error) {
      console.error("Top clients error:", error);
      res.status(500).json({ message: "Failed to load top clients" });
    }
  },
);

/**
 * GET /dashboard/recent-orders
 * Get recent orders
 */
router.get(
  "/recent-orders",
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 5;

    try {
      const recentOrders = await prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      });

      res.json({
        data: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          clientName: order.client.name,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
        })),
      });
    } catch (error) {
      console.error("Recent orders error:", error);
      res.status(500).json({ message: "Failed to load recent orders" });
    }
  },
);

/**
 * GET /dashboard/recent-payments
 * Get recent payments
 */
router.get(
  "/recent-payments",
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.tenantId!;
    const limit = parseInt(req.query.limit as string) || 5;

    try {
      const recentPayments = await prisma.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          client: {
            select: { id: true, name: true },
          },
          order: {
            select: { orderNumber: true },
          },
        },
      });

      res.json({
        data: recentPayments.map((payment) => ({
          id: payment.id,
          clientName: payment.client.name,
          orderNumber: payment.order?.orderNumber || "N/A",
          amount: Number(payment.amount),
          method: payment.method,
          createdAt: payment.createdAt,
        })),
      });
    } catch (error) {
      console.error("Recent payments error:", error);
      res.status(500).json({ message: "Failed to load recent payments" });
    }
  },
);

/**
 * GET /dashboard/low-stock
 * Get low stock products
 */
router.get("/low-stock", async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenantId!;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const lowStockProducts = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        current_stock_kg: Prisma.Decimal;
        min_stock_kg: Prisma.Decimal;
      }>
    >`
      SELECT id, name, current_stock_kg, min_stock_kg
      FROM products 
      WHERE tenant_id = ${tenantId} 
        AND is_active = true 
        AND min_stock_kg > 0 
        AND current_stock_kg <= min_stock_kg
      ORDER BY (current_stock_kg / NULLIF(min_stock_kg, 0)) ASC
      LIMIT ${limit}
    `;

    res.json({
      data: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        currentStock: Number(product.current_stock_kg),
        minStock: Number(product.min_stock_kg),
      })),
    });
  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({ message: "Failed to load low stock products" });
  }
});

export const dashboardRouter: Router = router;
