/**
 * Products Service
 * Handles business logic for product operations
 */

const { supabaseAdmin } = require('../../config/database');
const { PAGINATION } = require('../../config/constants');
const { createError } = require('../../middlewares');

const productsService = {
  /**
   * Get all products for an organization
   */
  getAll: async (organizationId, options = {}) => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      categoryId,
      isActive,
    } = options;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select('*, categories(id, name), units!base_unit_id(id, name, abbreviation)', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error, count } = await query;

    if (error) {
      throw createError.internal('Failed to fetch products');
    }

    return {
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  /**
   * Get product by ID
   */
  getById: async (organizationId, productId) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name), units!base_unit_id(id, name, abbreviation), product_units(*, units(*))')
      .eq('organization_id', organizationId)
      .eq('id', productId)
      .single();

    if (error || !data) {
      throw createError.notFound('Product');
    }

    return data;
  },

  /**
   * Create a new product
   */
  create: async (organizationId, productData) => {
    const {
      name,
      description,
      barcode,
      categoryId,
      baseUnitId,
      purchasePrice,
      sellingPrice,
      stockQuantity = 0,
      lowStockThreshold = 10,
    } = productData;

    // Validate required fields
    if (!name || !baseUnitId) {
      throw createError.badRequest('Name and base unit are required');
    }

    // Check for duplicate barcode
    if (barcode) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('barcode', barcode)
        .single();

      if (existing) {
        throw createError.conflict('Product with this barcode already exists');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: organizationId,
        name,
        description,
        barcode,
        category_id: categoryId,
        base_unit_id: baseUnitId,
        purchase_price: purchasePrice || 0,
        selling_price: sellingPrice || 0,
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
      })
      .select('*, categories(id, name), units!base_unit_id(id, name, abbreviation)')
      .single();

    if (error) {
      throw createError.internal('Failed to create product');
    }

    return data;
  },

  /**
   * Update a product
   */
  update: async (organizationId, productId, updates) => {
    // Build update object
    const updateData = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.baseUnitId !== undefined) updateData.base_unit_id = updates.baseUnitId;
    if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice;
    if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
    if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    // Check barcode uniqueness if updating
    if (updateData.barcode) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('barcode', updateData.barcode)
        .neq('id', productId)
        .single();

      if (existing) {
        throw createError.conflict('Product with this barcode already exists');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('organization_id', organizationId)
      .eq('id', productId)
      .select('*, categories(id, name), units!base_unit_id(id, name, abbreviation)')
      .single();

    if (error || !data) {
      throw createError.notFound('Product');
    }

    return data;
  },

  /**
   * Delete a product (soft delete by setting is_active = false)
   */
  delete: async (organizationId, productId) => {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('id', productId);

    if (error) {
      throw createError.notFound('Product');
    }
  },

  /**
   * Get product units
   */
  getProductUnits: async (organizationId, productId) => {
    // First verify product belongs to organization
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', productId)
      .single();

    if (!product) {
      throw createError.notFound('Product');
    }

    const { data, error } = await supabaseAdmin
      .from('product_units')
      .select('*, units(*)')
      .eq('product_id', productId);

    if (error) {
      throw createError.internal('Failed to fetch product units');
    }

    return data;
  },

  /**
   * Add a unit to a product
   */
  addProductUnit: async (organizationId, productId, { unitId, conversionFactor, sellingPrice }) => {
    // Verify product belongs to organization
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', productId)
      .single();

    if (!product) {
      throw createError.notFound('Product');
    }

    const { data, error } = await supabaseAdmin
      .from('product_units')
      .insert({
        product_id: productId,
        unit_id: unitId,
        conversion_factor: conversionFactor,
        selling_price: sellingPrice,
      })
      .select('*, units(*)')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw createError.conflict('This unit is already added to the product');
      }
      throw createError.internal('Failed to add product unit');
    }

    return data;
  },

  /**
   * Remove a unit from a product
   */
  removeProductUnit: async (organizationId, productId, unitId) => {
    // Verify product belongs to organization
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', productId)
      .single();

    if (!product) {
      throw createError.notFound('Product');
    }

    const { error } = await supabaseAdmin
      .from('product_units')
      .delete()
      .eq('product_id', productId)
      .eq('unit_id', unitId);

    if (error) {
      throw createError.internal('Failed to remove product unit');
    }
  },

  /**
   * Get products with low stock
   */
  getLowStock: async (organizationId) => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name), units!base_unit_id(id, name, abbreviation)')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .filter('stock_quantity', 'lte', 'low_stock_threshold');

    if (error) {
      throw createError.internal('Failed to fetch low stock products');
    }

    // Filter in JS since Supabase can't compare two columns directly
    return data.filter(p => p.stock_quantity <= p.low_stock_threshold);
  },
};

module.exports = productsService;
