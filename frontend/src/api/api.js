const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function fetchApi(endpoint, options = {}) {
    const url = `${BASE}${endpoint}`;
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    try {
        const response = await fetch(url, options);
        
        // Auto-logout on expired/invalid tokens (skip auth endpoints)
        if (response.status === 401 && !endpoint.startsWith('/api/auth/')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        
        if (!response.ok) {
            let errorMsg = `Error ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.detail) errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
            } catch (e) {
                // Not JSON
            }
            throw new Error(errorMsg);
        }
        
        // Handle 204 No Content
        if (response.status === 204) return null;
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function uploadCSV(file) {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi("/api/leads/upload", {
        method: "POST",
        body: formData,
    });
}

export async function addLeadManual(data) {
    return fetchApi("/api/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

export async function getLeads(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/api/leads?${query}` : "/api/leads";
    return fetchApi(endpoint);
}

export async function updateLeadStatus(id, status) {
    return fetchApi(`/api/leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
}

export async function deleteLead(id) {
    return fetchApi(`/api/leads/${id}`, {
        method: "DELETE",
    });
}

export async function generateMessages(payload) {
    return fetchApi("/api/campaign/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function sendCampaign(id, tone) {
    return fetchApi(`/api/campaign/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
    });
}

export async function sendFollowups(id) {
    return fetchApi(`/api/campaign/${id}/followup`, {
        method: "POST",
    });
}

export async function getCampaigns() {
    return fetchApi("/api/campaign");
}

export async function getCampaignMessages(id) {
    return fetchApi(`/api/campaign/${id}/messages`);
}

export async function getAnalytics() {
    return fetchApi("/api/analytics/summary");
}

export async function getQuota() {
    return fetchApi("/api/analytics/quota");
}

export async function loginUser(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return fetchApi("/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: formData.toString()
    });
}

export async function registerUser(email, password) {
    return fetchApi("/api/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
    });
}

export async function getUserSettings() {
    return fetchApi("/api/user/settings");
}

export async function updateUserSettings(settings) {
    return fetchApi("/api/user/settings", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(settings)
    });
}

export async function importFromSheets(sheetUrl) {
    return fetchApi("/api/leads/import/sheets", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ sheet_url: sheetUrl })
    });
}

