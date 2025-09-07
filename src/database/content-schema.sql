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

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT,
    image VARCHAR(512),
    is_active BOOLEAN DEFAULT 1,
    [order] INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- About Us content table
CREATE TABLE IF NOT EXISTS about_us_content (
    id VARCHAR(36) PRIMARY KEY,
    goal TEXT NOT NULL,
    mission TEXT NOT NULL,
    roles_responsibilities TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT,
    location VARCHAR(255),
    type VARCHAR(50),
    attendees INTEGER DEFAULT 0,
    max_attendees INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Navigation items
CREATE TABLE IF NOT EXISTS navigation_items (
    id VARCHAR(36) PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'main',
    [order] INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Rewrite content (singleton style)
CREATE TABLE IF NOT EXISTS exam_rewrite_content (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT,
    description TEXT,
    heroTitle TEXT,
    heroDescription TEXT,
    benefits TEXT,
    process TEXT,
    subjects TEXT,
    applicationFormUrl TEXT,
    grade11FormUrl TEXT,
    grade12FormUrl TEXT,
    pricingInfo TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- University Application content (singleton style)
CREATE TABLE IF NOT EXISTS university_application_content (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT,
    description TEXT,
    services TEXT,
    process TEXT,
    requirements TEXT,
    pricing TEXT,
    formUrl TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);