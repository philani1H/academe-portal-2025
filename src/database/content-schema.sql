-- Content tables for website content

-- Tutors table
CREATE TABLE IF NOT EXISTS tutors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subjects TEXT NOT NULL,
    image VARCHAR(512),
    contactName VARCHAR(255),
    contactPhone VARCHAR(20),
    contactEmail VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings for tutors
CREATE TABLE IF NOT EXISTS tutor_ratings (
    id VARCHAR(36) PRIMARY KEY,
    tutor_id VARCHAR(36) NOT NULL,
    studentName VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    date DATE DEFAULT (date('now')),
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE
);

-- Hero content
CREATE TABLE IF NOT EXISTS hero_content (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    buttonText VARCHAR(255),
    buttonLink VARCHAR(255),
    imageUrl VARCHAR(512),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features
CREATE TABLE IF NOT EXISTS features (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    content TEXT NOT NULL,
    image VARCHAR(512),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    interval VARCHAR(50),
    features TEXT NOT NULL,
    isPopular BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Footer content
CREATE TABLE IF NOT EXISTS footer_content (
    id VARCHAR(36) PRIMARY KEY,
    companyInfo TEXT,
    socialLinks TEXT,
    quickLinks TEXT,
    contactInfo TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);