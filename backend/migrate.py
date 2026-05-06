import sqlite3
import os

def migrate():
    # Correct path based on settings.database_url = "sqlite:///../salesagent.db"
    # When running from backend directory, the file is at ../salesagent.db
    db_path = "../salesagent.db"
    
    if not os.path.exists(db_path):
        # Try local if ../ doesn't exist, just in case
        if os.path.exists("test.db"):
             db_path = "test.db"
        else:
             print(f"Database not found at {db_path} or test.db. Check your directory.")
             return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"Connected to {db_path}")
        
        # Create campaigns table if not exists
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS campaigns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    status VARCHAR(20) DEFAULT 'ready',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """)
            conn.commit()
            print("Ensured 'campaigns' table exists.")
        except Exception as e:
            print(f"Error creating 'campaigns' table: {e}")

        # Try to add status column if it's missing
        try:
            cursor.execute("ALTER TABLE campaigns ADD COLUMN status VARCHAR(20) DEFAULT 'ready'")
            conn.commit()
            print("Successfully added 'status' column to 'campaigns' table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("Column 'status' already exists in 'campaigns' table.")
            else:
                print(f"Note on 'campaigns' column addition: {e}")

        # Create pipeline_jobs table
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pipeline_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    campaign_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    total_leads INTEGER NOT NULL DEFAULT 0,
                    processed INTEGER NOT NULL DEFAULT 0,
                    succeeded INTEGER NOT NULL DEFAULT 0,
                    failed INTEGER NOT NULL DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'pending',
                    error_message TEXT,
                    started_at DATETIME,
                    finished_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """)
            conn.commit()
            print("Successfully ensured 'pipeline_jobs' table exists.")
        except Exception as e:
            print(f"Error creating 'pipeline_jobs' table: {e}")

        # Create enrichment_cache table
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS enrichment_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_key VARCHAR(255) UNIQUE NOT NULL,
                    company_name VARCHAR(255) NOT NULL,
                    stage VARCHAR(50),
                    pain_points TEXT,
                    best_hook TEXT,
                    tone VARCHAR(20),
                    provider VARCHAR(50) DEFAULT 'gemini',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL
                )
            """)
            conn.commit()
            print("Successfully ensured 'enrichment_cache' table exists.")
        except Exception as e:
            print(f"Error creating 'enrichment_cache' table: {e}")

        conn.close()
        print("Migration complete.")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
