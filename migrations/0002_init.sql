-- Alter table privlinks to set id as autoincrement

-- Migration number: 0002 	 2024-03-20T06:58:43.387Z
DROP TABLE IF EXISTS privlinks;
CREATE TABLE IF NOT EXISTS privlinks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	link TEXT NOT NULL,
	password TEXT,
	content TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

