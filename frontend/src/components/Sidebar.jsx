import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV_ITEMS = [
    {
        path: '/app/',
        label: 'Upload Leads',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        )
    },
    {
        path: '/app/campaign',
        label: 'Campaigns',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="16" y2="12" />
                <line x1="3" y1="18" x2="19" y2="18" />
            </svg>
        )
    },
    {
        path: '/app/dashboard',
        label: 'Dashboard',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="6" width="4" height="15" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
        )
    },
    {
        path: '/app/settings',
        label: 'Settings',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="17" x2="20" y2="17" />
                <circle cx="8" cy="7" r="2" />
                <circle cx="16" cy="17" r="2" />
            </svg>
        )
    }
];

export default function Sidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    // Extract email from JWT payload (avoids touching AuthContext)
    let email = '';
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            email = payload.sub || '';
        }
    } catch { /* ignore decode errors */ }

    return (
        <aside style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '220px',
            height: '100vh',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50
        }}>
            {/* Logo */}
            <div style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <span style={{
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '15px',
                    letterSpacing: '-0.01em'
                }}>
                    SalesAgent
                </span>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '8px 0' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                height: '36px',
                                padding: '0 16px',
                                fontSize: '13px',
                                fontWeight: 400,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                                borderLeft: isActive ? '2px solid var(--blue-primary)' : '2px solid transparent',
                                textDecoration: 'none',
                                transition: 'background 0.1s, color 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--bg-elevated)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <span style={{
                                color: isActive ? 'var(--blue-primary)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: User + Logout */}
            <div style={{
                borderTop: '1px solid var(--border-subtle)',
                padding: '12px 16px'
            }}>
                {email && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '8px'
                    }}>
                        {email}
                    </div>
                )}
                <button
                    onClick={logout}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'var(--font-sans)',
                        transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}
