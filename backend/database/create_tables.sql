-- Створення таблиці для Facebook акаунтів
CREATE TABLE IF NOT EXISTS facebook_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    facebook_id TEXT UNIQUE NOT NULL,
    group_name TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'banned')),
    token_status TEXT DEFAULT 'active' CHECK(token_status IN ('active', 'expired', 'invalid')),
    access_token TEXT,
    user_agent TEXT,
    cookies_data TEXT,
    proxy_id INTEGER,
    balance TEXT,
    daily_limit TEXT,
    cookies_loaded BOOLEAN DEFAULT 0,
    primary_cabinet TEXT,
    primary_cabinet_id TEXT,
    total_cabinets INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proxy_id) REFERENCES proxies(id)
);

-- Створення таблиці для проксі
CREATE TABLE IF NOT EXISTS proxies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    type TEXT DEFAULT 'http' CHECK(type IN ('http', 'https', 'socks4', 'socks5')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Створення таблиці для рекламних кабінетів
CREATE TABLE IF NOT EXISTS ad_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facebook_account_id INTEGER NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    currency TEXT DEFAULT 'USD',
    timezone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id)
);

-- Створення таблиці для Facebook сторінок
CREATE TABLE IF NOT EXISTS facebook_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facebook_account_id INTEGER NOT NULL,
    page_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facebook_account_id) REFERENCES facebook_accounts(id)
);