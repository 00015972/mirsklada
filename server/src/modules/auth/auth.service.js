/**
 * Authentication Service
 * Handles business logic for authentication operations
 */

const { supabase, supabaseAdmin } = require('../../config/database');
const { ROLES } = require('../../config/constants');
const { createError } = require('../../middlewares');

const authService = {
  /**
   * Register a new user and organization
   * @param {Object} data - Registration data
   * @returns {Object} User and session data
   */
  register: async ({ email, password, fullName, phone, organizationName }) => {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw createError.conflict('Email is already registered');
      }
      throw createError.badRequest(authError.message);
    }

    try {
      // 2. Create organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: organizationName,
        })
        .select()
        .single();

      if (orgError) {
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw createError.internal('Failed to create organization');
      }

      // 3. Create user record in our users table
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: authData.user.id,
          organization_id: org.id,
          email,
          full_name: fullName,
          phone,
          role: ROLES.OWNER, // First user is owner
        })
        .select()
        .single();

      if (userError) {
        // Rollback
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        await supabaseAdmin.from('organizations').delete().eq('id', org.id);
        throw createError.internal('Failed to create user record');
      }

      // 4. Create default units for the organization
      await authService.createDefaultUnits(org.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          organizationId: org.id,
          organizationName: org.name,
        },
      };
    } catch (error) {
      // Cleanup on any error
      if (authData?.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      throw error;
    }
  },

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Object} User and session data
   */
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw createError.unauthorized('Invalid email or password');
    }

    // Get user details from our table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, organizations(*)')
      .eq('auth_id', data.user.id)
      .single();

    if (userError || !user) {
      throw createError.unauthorized('User not found in system');
    }

    if (!user.is_active) {
      throw createError.unauthorized('Account is deactivated');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
        organizationName: user.organizations.name,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    };
  },

  /**
   * Logout user
   * @param {string} token - Access token
   */
  logout: async (token) => {
    await supabase.auth.signOut();
  },

  /**
   * Refresh access token
   * @param {string} refreshToken 
   * @returns {Object} New session data
   */
  refreshToken: async (refreshToken) => {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw createError.unauthorized('Invalid refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  },

  /**
   * Get user by ID
   * @param {string} userId 
   * @returns {Object} User data
   */
  getUserById: async (userId) => {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw createError.notFound('User');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      organizationId: user.organization_id,
      organization: {
        id: user.organizations.id,
        name: user.organizations.name,
      },
      createdAt: user.created_at,
    };
  },

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Object} Updated user
   */
  updateProfile: async (userId, { fullName, phone }) => {
    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw createError.internal('Failed to update profile');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
    };
  },

  /**
   * Change user password
   * @param {string} authId - Supabase Auth user ID
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  changePassword: async (authId, currentPassword, newPassword) => {
    // Supabase handles password change
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authId, {
      password: newPassword,
    });

    if (error) {
      throw createError.badRequest('Failed to change password');
    }
  },

  /**
   * Request password reset
   * @param {string} email 
   */
  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    // Don't throw error to prevent email enumeration
    if (error) {
      console.error('Password reset error:', error);
    }
  },

  /**
   * Reset password with token
   * @param {string} token 
   * @param {string} newPassword 
   */
  resetPassword: async (token, newPassword) => {
    // This would be handled by Supabase's built-in flow
    throw createError.internal('Use Supabase password reset flow');
  },

  /**
   * Create default units for a new organization
   * @param {string} organizationId 
   */
  createDefaultUnits: async (organizationId) => {
    const defaultUnits = [
      { name: 'Kilogram', abbreviation: 'kg' },
      { name: 'Gram', abbreviation: 'g' },
      { name: 'Piece', abbreviation: 'pc' },
      { name: 'Box', abbreviation: 'box' },
      { name: 'Bag', abbreviation: 'bag' },
      { name: 'Litre', abbreviation: 'L' },
      { name: 'Bottle', abbreviation: 'btl' },
    ];

    const unitsWithOrg = defaultUnits.map(unit => ({
      ...unit,
      organization_id: organizationId,
    }));

    await supabaseAdmin.from('units').insert(unitsWithOrg);
  },
};

module.exports = authService;
