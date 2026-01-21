
import cron from 'node-cron';

const SITEMAP_URL = 'https://www.excellenceakademie.co.za/sitemap.xml';
const SITE_NAME = 'Excellence Academia';

interface SeasonalTrend {
  month: number; // 0-11
  keywords: string[];
  socialHashtags: string[];
  priority: 'high' | 'medium' | 'low';
}

// Seasonal keyword database
const SEASONAL_TRENDS: SeasonalTrend[] = [
  {
    month: 0, // January
    keywords: ['matric results 2025', 'late university applications', 'nsfas appeal', 'upgrade matric results', 'matric rewrite'],
    socialHashtags: ['#MatricResults2025', '#LateApplications', '#NSFAS', '#MatricRewrite'],
    priority: 'high'
  },
  {
    month: 1, // February
    keywords: ['late registration', 'university orientation', 'first year university tips', 'tutor for first year', 'matric rewrite registration'],
    socialHashtags: ['#LateRegistration', '#FirstYear', '#UniversityLife', '#MatricUpgrade'],
    priority: 'high'
  },
  {
    month: 4, // May
    keywords: ['exam preparation', 'mid-year exams', 'grade 12 past papers', 'maths tutor', 'science tutor'],
    socialHashtags: ['#ExamPrep', '#StudyTips', '#Grade12', '#MathsTutor'],
    priority: 'medium'
  },
  {
    month: 5, // June
    keywords: ['june exams', 'winter school', 'matric revision camp', 'university open days'],
    socialHashtags: ['#JuneExams', '#WinterSchool', '#MatricRevision', '#OpenDay'],
    priority: 'medium'
  },
  {
    month: 7, // August
    keywords: ['university applications 2026', 'cao application', 'nsfas application 2026', 'grade 11 marks'],
    socialHashtags: ['#ApplyNow', '#UniversityApplications', '#NSFAS2026', '#ClassOf2025'],
    priority: 'high'
  },
  {
    month: 9, // October
    keywords: ['matric finals', 'final exam timetable', 'study schedule', 'last minute revision'],
    socialHashtags: ['#MatricFinals', '#FinalPush', '#StudyMotivation', '#ClassOf2025'],
    priority: 'high'
  }
];

// Fallback/General trends
const GENERAL_TRENDS = {
  keywords: ['online tutoring', 'maths tutor south africa', 'science tutor', 'university application assistance', 'excellence academia'],
  socialHashtags: ['#Education', '#Tutoring', '#SouthAfrica', '#ExcellenceAcademia']
};

export class TrendService {
  private static instance: TrendService;

  private constructor() {}

  public static getInstance(): TrendService {
    if (!TrendService.instance) {
      TrendService.instance = new TrendService();
    }
    return TrendService.instance;
  }

  /**
   * Returns the current trending keywords based on the month.
   * Combines seasonal keywords with general keywords.
   */
  public getCurrentTrends() {
    const currentMonth = new Date().getMonth();
    const seasonal = SEASONAL_TRENDS.find(t => t.month === currentMonth);
    
    // If no specific trend for this month, check previous month (some trends carry over) or use general
    // For simplicity, we just merge if found, or use general.
    
    let keywords = [...GENERAL_TRENDS.keywords];
    let hashtags = [...GENERAL_TRENDS.socialHashtags];

    if (seasonal) {
      keywords = [...seasonal.keywords, ...keywords];
      hashtags = [...seasonal.socialHashtags, ...hashtags];
    }

    return {
      keywords: Array.from(new Set(keywords)), // Remove duplicates
      hashtags: Array.from(new Set(hashtags))
    };
  }

  /**
   * Starts the daily background promotion task.
   */
  public startBackgroundTasks() {
    console.log('⏰ Initializing Background Trend & Promotion Service...');
    
    // Run every day at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🚀 Running Daily Promotion & Trend Check...');
      await this.pingSearchEngines();
      this.logDailySocialContent();
    });
    
    console.log('✅ Background tasks scheduled (Daily at 09:00 AM).');
  }

  private async pingSearchEngines() {
    const engines = [
      { name: 'Google', url: `http://www.google.com/ping?sitemap=${SITEMAP_URL}` },
      { name: 'Bing', url: `http://www.bing.com/ping?sitemap=${SITEMAP_URL}` }
    ];

    console.log('\n📡 Pinging Search Engines...');
    for (const engine of engines) {
      try {
        const res = await fetch(engine.url);
        console.log(`   ✅ Pinged ${engine.name}: Status Code ${res.status}`);
      } catch (e: any) {
        console.error(`   ❌ Failed to ping ${engine.name}: ${e.message}`);
      }
    }
  }

  private logDailySocialContent() {
    const trends = this.getCurrentTrends();
    const content = `🔥 TRENDING TODAY: ${trends.hashtags.join(' ')}\nNeed help with ${trends.keywords[0]}? Join Excellence Academia! 👉 https://www.excellenceakademie.co.za`;
    
    console.log('\n📱 Suggested Social Post for Today:');
    console.log('-----------------------------------');
    console.log(content);
    console.log('-----------------------------------');
    // In a real app, this could save to a DB or send an email to the admin
  }
}
