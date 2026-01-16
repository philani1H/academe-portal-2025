
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'APP-Database.db');
const db = new Database(dbPath);

// Map SQLite table name to Prisma Model name
const tableMap: Record<string, string> = {
  'users': 'User',
  'courses': 'Course',
  'announcements_board': 'Announcement',
  'admin_users': 'AdminUser',
  'announcements': 'announcements', // Model name is announcements
  'HeroContent': 'HeroContent',
  'Feature': 'Feature',
  'PricingPlan': 'PricingPlan',
  'Testimonial': 'Testimonial',
  'TeamMember': 'TeamMember',
  'AboutUsContent': 'AboutUsContent',
  'SiteSettings': 'SiteSettings',
  'Tutor': 'Tutor',
  'Subject': 'Subject',
  'FooterContent': 'FooterContent',
  'NavigationItem': 'NavigationItem',
  'BecomeTutorContent': 'BecomeTutorContent',
  'ExamRewriteContent': 'ExamRewriteContent',
  'ContactUsContent': 'ContactUsContent'
};

const data: Record<string, any[]> = {};

for (const [sqliteTable, prismaModel] of Object.entries(tableMap)) {
  try {
    const rows = db.prepare(`SELECT * FROM "${sqliteTable}"`).all();
    if (rows.length === 0) continue;
    
    console.log(`Exporting ${rows.length} rows from ${sqliteTable} as ${prismaModel}`);
    
    const processedRows = rows.map((row: any) => {
      let newRow: any = { ...row };
      
      // Transform keys for mapped models
      if (prismaModel === 'User') {
        newRow = {
           id: row.id,
           name: row.name,
           email: row.email,
           password_hash: row.password_hash,
           role: row.role,
           department: row.department,
           subjects: row.subjects,
           studentNumber: row.student_number,
           programCode: row.program_code,
           personalEmail: row.personal_email,
           createdAt: row.created_at,
           updatedAt: row.updated_at
        };
      } else if (prismaModel === 'Course') {
        newRow = {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            department: row.department,
            tutorId: row.tutor_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
      } else if (prismaModel === 'AdminUser') {
          newRow = {
              id: row.id,
              username: row.username,
              displayName: row.display_name,
              email: row.email,
              personalEmail: row.personal_email,
              passwordHash: row.password_hash,
              permissions: row.permissions,
              createdAt: row.created_at,
              updatedAt: row.updated_at
          };
      } else if (prismaModel === 'Announcement') {
          newRow = {
              id: row.id,
              title: row.title,
              content: row.content,
              type: row.type,
              department: row.department,
              authorId: row.author_id,
              pinned: row.pinned,
              createdAt: row.created_at,
              updatedAt: row.updated_at
          };
      }
      
      // Generic processing for booleans and dates
      for (const key in newRow) {
        if (newRow[key] === undefined) continue;

        // Convert 0/1 to boolean
        if (['isActive', 'popular', 'pinned', 'read', 'starred', 'processed'].includes(key)) {
            newRow[key] = Boolean(newRow[key]);
        }
        // Convert integer timestamps to ISO strings
        if (['createdAt', 'updatedAt', 'joinedAt', 'timestamp', 'created_at', 'updated_at'].includes(key) && typeof newRow[key] === 'number') {
            newRow[key] = new Date(newRow[key]).toISOString();
        }
      }
      return newRow;
    });

    data[prismaModel] = processedRows;
  } catch (e) {
    console.error(`Error exporting ${sqliteTable}:`, e.message);
  }
}

fs.writeFileSync('data-root.json', JSON.stringify(data, null, 2));
console.log('Data exported to data-root.json');
