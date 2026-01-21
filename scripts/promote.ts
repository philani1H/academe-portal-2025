const SITEMAP_URL = 'https://www.excellenceakademie.co.za/sitemap.xml';
const SITE_NAME = 'Excellence Academia';

const searchEngines = [
  {
    name: 'Google',
    url: `http://www.google.com/ping?sitemap=${SITEMAP_URL}`
  },
  {
    name: 'Bing',
    url: `http://www.bing.com/ping?sitemap=${SITEMAP_URL}`
  }
];

console.log(`🚀 Starting Promotion Script for ${SITE_NAME}...`);
console.log('------------------------------------------------');

// 1. Ping Search Engines
console.log('\n📡 Pinging Search Engines...');
(async () => {
  for (const engine of searchEngines) {
    try {
      const res = await fetch(engine.url);
      console.log(`   ✅ Pinged ${engine.name}: Status Code ${res.status}`);
    } catch (e: any) {
      console.error(`   ❌ Failed to ping ${engine.name}: ${e.message}`);
    }
  }

  // 2. Generate Social Media Posts
  const socialPosts = [
    {
      platform: 'Twitter/X',
      content: `🚀 Ready to ace your exams? Join ${SITE_NAME} for expert tutoring and university application support! 🎓 Apply to Wits, UJ, UCT & more with ease. \n\n👉 https://www.excellenceakademie.co.za \n\n#Education #Matric2025 #UniversityApplications #StudyTok`
    },
    {
      platform: 'Facebook/Instagram',
      content: `🎓 DREAMING OF UNIVERSITY? \n\nDon't let the application process stress you out! At ${SITE_NAME}, we help you:\n✅ Apply to Top Universities (UCT, Wits, UJ, UP)\n✅ Secure NSFAS Funding\n✅ Master your Matric subjects with Expert Tutors\n\n👇 Start your journey today:\nhttps://www.excellenceakademie.co.za`
    },
    {
      platform: 'WhatsApp Status',
      content: `Need a tutor or help with Uni apps? 📚✨ Check out Excellence Academia! They helped me apply to Wits & UJ. \n\n👉 https://www.excellenceakademie.co.za`
    }
  ];

  console.log('\n📱 Generated Social Media Content (Copy & Post):');
  socialPosts.forEach(post => {
    console.log(`\n[${post.platform}]`);
    console.log('-------------------');
    console.log(post.content);
    console.log('-------------------');
  });

  // 3. SEO Checklist Reminder
  console.log('\n✅ SEO & Growth Checklist:');
  console.log('   [ ] Share the generated posts on all official social channels.');
  console.log('   [ ] Ask 5 tutors/students to share the WhatsApp link today.');
  console.log('   [ ] Check Google Search Console for new indexing.');
  console.log('   [ ] Verify "SocialShare" button is visible on the Home Page.');

  console.log('\n🎉 Promotion Script Completed!');
})();
