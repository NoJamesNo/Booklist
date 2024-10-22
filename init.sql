-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255)
);

-- Create books table with add_count
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    google_books_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    authors TEXT[],
    thumbnail_url VARCHAR(255),
    add_count INTEGER DEFAULT 0
);

-- Create user_books table
CREATE TABLE IF NOT EXISTS user_books (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    book_id INTEGER REFERENCES books(id),
    status VARCHAR(50) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book_id ON user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);