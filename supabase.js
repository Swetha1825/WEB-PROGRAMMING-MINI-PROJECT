// Supabase Client Library (Simplified for browser)
// Load from CDN in production
let supabaseClient = null;

async function initSupabase() {
    try {
        // In production, you would load the Supabase JS client library
        // For now, we're creating a mock client for development
        
        // Create a simple HTTP-based Supabase client
        window.supabaseClient = {
            // Auth methods
            auth: {
                signUp: signUpUser,
                signIn: signInUser,
                signOut: signOutUser,
                getSession: getSession
            },
            // Database methods
            from: (tableName) => ({
                select: (columns = '*') => selectFromTable(tableName, columns),
                insert: (data) => insertIntoTable(tableName, data),
                update: (data) => updateTable(tableName, data),
                delete: () => deleteFromTable(tableName),
                eq: (column, value) => ({ filterColumn: column, filterValue: value })
            })
        };
        
        return window.supabaseClient;
    } catch (error) {
        console.error('Supabase initialization failed:', error);
    }
}

// Mock database operations (replace with actual API calls)
async function selectFromTable(tableName, columns) {
    try {
        const filters = this.filterColumn ? `?${this.filterColumn}=${this.filterValue}` : '';
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}${filters}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Select failed:', error);
        return [];
    }
}

async function insertIntoTable(tableName, data) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Insert failed:', error);
        return null;
    }
}

async function updateTable(tableName, data) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Update failed:', error);
        return null;
    }
}

async function deleteFromTable(tableName) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Delete failed:', error);
        return null;
    }
}

// Authentication functions
async function signUpUser(email, password, name, requestAdmin = false) {
    try {
        // Store user data in localStorage (mock implementation)
        const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
            throw new Error('Email already registered');
        }
        
        const newUser = {
            id: generateUUID(),
            email: email,
            password: hashPassword(password), // In production, use server-side hashing
            name: name,
            is_admin: false,
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('click2cart_users', JSON.stringify(users));
        
        // Handle admin request
        if (requestAdmin) {
            const adminRequests = JSON.parse(localStorage.getItem('click2cart_admin_requests') || '[]');
            
            // Check if there are any admins
            const hasAdmin = users.some(u => u.is_admin);
            
            const adminRequest = {
                user_id: newUser.id,
                user_name: name,
                user_email: email,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            if (!hasAdmin) {
                // If no admin exists, make this user the first admin
                newUser.is_admin = true;
                users[users.length - 1] = newUser;
                localStorage.setItem('click2cart_users', JSON.stringify(users));
            } else {
                // Otherwise, add to admin requests
                adminRequests.push(adminRequest);
                localStorage.setItem('click2cart_admin_requests', JSON.stringify(adminRequests));
            }
        }
        
        return {
            user: { 
                id: newUser.id, 
                email: newUser.email, 
                name: newUser.name,
                is_admin: newUser.is_admin 
            },
            session: { access_token: generateToken(newUser.id) }
        };
    } catch (error) {
        throw error;
    }
}

async function signInUser(email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('click2cart_users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify password
        if (user.password !== hashPassword(password)) {
            throw new Error('Invalid password');
        }
        
        const token = generateToken(user.id);
        localStorage.setItem('click2cart_session', JSON.stringify({
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_admin: user.is_admin
            }
        }));
        
        return {
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                is_admin: user.is_admin 
            },
            session: { access_token: token }
        };
    } catch (error) {
        throw error;
    }
}

async function signOutUser() {
    localStorage.removeItem('click2cart_session');
    localStorage.removeItem('click2cart_cart');
}

function getSession() {
    const session = localStorage.getItem('click2cart_session');
    return session ? JSON.parse(session) : null;
}

function getAuthToken() {
    const session = getSession();
    return session ? session.access_token : null;
}

// Helper functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateToken(userId) {
    return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + userId;
}

function hashPassword(password) {
    // Simple hash for demo purposes (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Initialize Supabase on page load
document.addEventListener('DOMContentLoaded', initSupabase);
