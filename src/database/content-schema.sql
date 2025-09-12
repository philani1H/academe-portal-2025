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

-- Contact Us content (singleton style)
CREATE TABLE IF NOT EXISTS contact_us_content (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT,
    description TEXT,
    contactInfo TEXT,
    formFields TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Become Tutor content (singleton style)
CREATE TABLE IF NOT EXISTS become_tutor_content (
    id VARCHAR(36) PRIMARY KEY,
    title TEXT,
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    applicationProcess TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    pinned BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT OR IGNORE INTO features (id, title, description, icon, order_index) VALUES 
    ('f1', 'Expert Tutors', 'Learn from experienced professionals', 'graduation-cap', 1),
    ('f2', 'Flexible Schedule', 'Study at your own pace', 'clock', 2),
    ('f3', 'Interactive Learning', 'Engaging multimedia content', 'play', 3);

INSERT OR IGNORE INTO subjects (id, name, description, icon) VALUES 
    ('s1', 'Mathematics', 'Advanced mathematics courses', 'calculator'),
    ('s2', 'Physics', 'Physics fundamentals and advanced topics', 'atom'),
    ('s3', 'Chemistry', 'Organic and inorganic chemistry', 'flask'),
    ('s4', 'English', 'Language and literature', 'book'),
    ('s5', 'History', 'World and local history', 'globe');

INSERT OR IGNORE INTO announcements (id, title, content, pinned) VALUES 
    ('a1', 'Welcome to Our Platform', 'We are excited to have you join our learning community!', 1),
    ('a2', 'New Course Available', 'Check out our latest mathematics course', 0);

INSERT OR IGNORE INTO testimonials (id, name, content, rating) VALUES 
    ('t1', 'John Doe', 'Amazing platform! The tutors are excellent.', 5),
    ('t2', 'Jane Smith', 'Great learning experience, highly recommended!', 5);

INSERT OR IGNORE INTO pricing_plans (id, name, price, interval, features, isPopular) VALUES 
    ('p1', 'Basic', 29.99, 'month', '["1-on-1 sessions", "Basic support"]', 0),
    ('p2', 'Premium', 59.99, 'month', '["Unlimited sessions", "Priority support", "Advanced materials"]', 1),
    ('p3', 'Pro', 99.99, 'month', '["All features", "Personal mentor", "Certification"]', 0);