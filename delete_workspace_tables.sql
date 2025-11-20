-- ========================================
-- SQL Script to Delete Workspace Tables
-- ========================================
-- 
-- WARNING: This will permanently delete all workspace-related data!
-- Make sure to backup your database before running this script.
-- 
-- Date: November 20, 2025
-- Purpose: Clean up workspace tables after removing workspace feature
-- 
-- ========================================

-- Drop workspace-related tables in correct order (respecting foreign keys)

-- Step 1: Drop dependent tables first
DROP TABLE IF EXISTS workspace_credits_logs CASCADE;
DROP TABLE IF EXISTS workspace_credits CASCADE;
DROP TABLE IF EXISTS workspace_invitations CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;

-- Step 2: Drop workspace settings tables
DROP TABLE IF EXISTS workspace_application_settings CASCADE;
DROP TABLE IF EXISTS workspace_admin_settings CASCADE;
DROP TABLE IF EXISTS workspace_settings CASCADE;

-- Step 3: Drop main workspaces table
DROP TABLE IF EXISTS workspaces CASCADE;

-- Step 4: Drop any workspace-related functions (if they exist)
DROP FUNCTION IF EXISTS get_workspace_members(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_workspace_admins(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_workspace_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_workspaces(uuid) CASCADE;

-- Step 5: Drop any workspace-related views (if they exist)
DROP VIEW IF EXISTS workspace_members_view CASCADE;
DROP VIEW IF EXISTS workspace_stats_view CASCADE;

-- Step 6: Clean up workspace_id from other tables (optional)
-- Uncomment the following if you want to remove workspace_id columns from other tables

-- Remove workspace_id from projects table
-- ALTER TABLE projects DROP COLUMN IF EXISTS workspace_id CASCADE;

-- Remove workspace_id from billing_customers table
-- ALTER TABLE billing_customers DROP COLUMN IF EXISTS workspace_id CASCADE;

-- ========================================
-- Verification Queries
-- ========================================
-- Run these queries after the script to verify deletion:

-- Check if workspace tables still exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%workspace%';

-- Check if workspace functions still exist
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name LIKE '%workspace%';

-- ========================================
-- NOTES:
-- ========================================
-- 1. This script uses CASCADE to automatically drop dependent objects
-- 2. All data will be permanently deleted - no recovery possible
-- 3. Make sure to backup before running
-- 4. Run this script in Supabase SQL Editor
-- 5. You may need to adjust based on your actual database schema
