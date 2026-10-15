// Supabase Configuration
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Database table structure documentation:
// 
// TABLE: users
// - id (uuid, primary key)
// - email (text, unique)
// - password (text - hashed in production)
// - name (text)
// - is_admin (boolean, default: false)
// - created_at (timestamp)
// 
// TABLE: products
// - id (uuid, primary key)
// - name (text)
// - price (numeric)
// - quantity (integer)
// - category (text)
// - description (text)
// - created_at (timestamp)
// - updated_at (timestamp)
// 
// TABLE: orders
// - id (uuid, primary key)
// - user_id (uuid, foreign key to users)
// - total_amount (numeric)
// - status (text: pending, accepted, rejected)
// - delivery_address (text)
// - phone_number (text)
// - created_at (timestamp)
// - updated_at (timestamp)
// 
// TABLE: order_items
// - id (uuid, primary key)
// - order_id (uuid, foreign key to orders)
// - product_id (uuid, foreign key to products)
// - quantity (integer)
// - price (numeric)
// - created_at (timestamp)
