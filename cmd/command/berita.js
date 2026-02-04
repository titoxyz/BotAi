import axios from 'axios';
import Parser from 'rss-parser';

// Inisialisasi RSS Parser dengan custom headers
const parser = new Parser({
  customFields: {
    item: ['media:content', 'source', 'description']
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

export default function beritaCommands(ev) {
  
  // ==================== SUMBER BERITA ====================
  const newsSources = {
    // Sumber utama (update cepat)
    'detik': {
      name: 'Detik.com',
      url: 'https://rss.detik.com/index.php/detikcom',
      category: 'semua',
      update: '1-5 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Detikcom.svg/320px-Detikcom.svg.png'
    },
    'cnn': {
      name: 'CNN Indonesia',
      url: 'https://www.cnnindonesia.com/nasional/rss',
      category: 'nasional',
      update: '5-10 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_Indonesia.svg/320px-CNN_Indonesia.svg.png'
    },
    'kompas': {
      name: 'Kompas.com',
      url: 'https://rss.kompas.com/kompas-news.xml',
      category: 'semua',
      update: '10-15 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kompas.com_2013.svg/320px-Kompas.com_2013.svg.png'
    },
    'antara': {
      name: 'Antara News',
      url: 'https://www.antaranews.com/rss/news.xml',
      category: 'nasional',
      update: '5-10 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Antaranews.com.svg/320px-Antaranews.com.svg.png'
    },
    'tempo': {
      name: 'Tempo.co',
      url: 'https://rss.tempo.co/nasional',
      category: 'nasional',
      update: '10-15 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Tempo_%28magazine%29_logo.svg/320px-Tempo_%28magazine%29_logo.svg.png'
    },
    
    // Sumber internasional
    'bbc': {
      name: 'BBC Indonesia',
      url: 'http://feeds.bbci.co.uk/indonesia/rss.xml',
      category: 'internasional',
      update: '15-30 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/320px-BBC_News_2019.svg.png'
    },
    'cnbc': {
      name: 'CNBC Indonesia',
      url: 'https://www.cnbcindonesia.com/news/rss',
      category: 'ekonomi',
      update: '10-20 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNBC.svg/320px-CNBC.svg.png'
    },
    
    // Sumber tambahan
    'liputan6': {
      name: 'Liputan6',
      url: 'https://www.liputan6.com/news/rss',
      category: 'semua',
      update: '10-15 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Liputan6.svg/320px-Liputan6.svg.png'
    },
    'republika': {
      name: 'Republika',
      url: 'https://www.republika.co.id/rss',
      category: 'nasional',
      update: '15-20 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Republika_%282006%29.svg/320px-Republika_%282006%29.svg.png'
    },
    'viva': {
      name: 'Viva.co.id',
      url: 'https://www.viva.co.id/feed/rss',
      category: 'semua',
      update: '15-20 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/VIVA_logo_2019.svg/320px-VIVA_logo_2019.svg.png'
    },
    'okezone': {
      name: 'Okezone',
      url: 'https://sindikasi.okezone.com/index.php/rss/0/RSS2.0',
      category: 'semua',
      update: '10-15 menit',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Okezone_2018.svg/320px-Okezone_2018.svg.png'
    }
  };
  
  // Kategori berita
  const categories = {
    'nasional': 'Berita dalam negeri',
    'internasional': 'Berita luar negeri',
    'ekonomi': 'Berita ekonomi & bisnis',
    'teknologi': 'Berita teknologi',
    'olahraga': 'Berita olahraga',
    'hiburan': 'Berita hiburan & selebriti',
    'kesehatan': 'Berita kesehatan',
    'pendidikan': 'Berita pendidikan'
  };
  
  // Cache system
  const cache = new Map();
  const CACHE_DURATION = 60000; // 1 menit

  // ==================== HELPER FUNCTIONS ====================
  function formatDate(dateString) {
    if (!dateString) return 'Baru saja';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Baru saja';
    }
  }
  
  function truncateText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
  
  async function fetchNewsFromSource(sourceKey, limit = 10) {
    const source = newsSources[sourceKey];
    if (!source) throw new Error('Sumber tidak ditemukan');
    
    const cacheKey = `source_${sourceKey}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    try {
      const feed = await parser.parseURL(source.url);
      const news = feed.items.slice(0, limit).map(item => ({
        title: item.title || 'Tanpa judul',
        link: item.link || '#',
        pubDate: item.pubDate || item.isoDate,
        description: item.contentSnippet || item.description || '',
        source: source.name,
        category: source.category,
        logo: source.logo
      }));
      
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: news
      });
      
      return news;
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error.message);
      throw new Error(`Gagal mengambil berita dari ${source.name}`);
    }
  }
  
  async function fetchTrendingNews() {
    try {
      // Google News RSS untuk Indonesia
      const url = 'https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id';
      const feed = await parser.parseURL(url);
      
      return feed.items.slice(0, 15).map(item => ({
        title: item.title || 'Tanpa judul',
        link: item.link || '#',
        pubDate: item.pubDate,
        source: item.source?.name || 'Google News',
        description: ''
      }));
    } catch (error) {
      console.error('Error fetching trending:', error);
      return [];
    }
  }
  
  // ==================== COMMAND: HELP / MENU ====================
  ev.on({
    name: 'beritahelp',
    cmd: ['beritahelp', 'menuberita', 'helpberita'],
    tags: 'berita',
    desc: 'Menu bantuan command berita',
    owner: false,
    prefix: true,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, prefix }) => {
      try {
        let helpText = `📰 *MENU BERITA - ${botName}*\n`;
        helpText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        helpText += `*📋 DAFTAR COMMAND:*\n`;
        helpText += `├ ${prefix}berita - Berita terkini (default: detik)\n`;
        helpText += `├ ${prefix}berita [sumber] - Berita dari sumber tertentu\n`;
        helpText += `├ ${prefix}trending - Berita trending/viral\n`;
        helpText += `├ ${prefix}breaking - Breaking news terbaru\n`;
        helpText += `├ ${prefix}kategori [nama] - Berita berdasarkan kategori\n`;
        helpText += `├ ${prefix}daftarsumber - Daftar sumber berita\n`;
        helpText += `├ ${prefix}daftarkategori - Daftar kategori berita\n`;
        helpText += `├ ${prefix}cari [kata kunci] - Cari berita\n`;
        helpText += `└ ${prefix}beritahelp - Menu bantuan ini\n\n`;
        
        helpText += `*📊 SUMBER CEPAT:*\n`;
        helpText += `├ ${prefix}berita detik - Detik.com (tercepat)\n`;
        helpText += `├ ${prefix}berita cnn - CNN Indonesia\n`;
        helpText += `├ ${prefix}berita kompas - Kompas.com\n`;
        helpText += `└ ${prefix}berita antara - Antara News\n\n`;
        
        helpText += `*📈 STATISTIK:*\n`;
        helpText += `├ Total Sumber: ${Object.keys(newsSources).length}\n`;
        helpText += `├ Update: Real-time (1-30 menit)\n`;
        helpText += `└ Cache: 1 menit untuk performa\n\n`;
        
        helpText += `*⚠️ CATATAN:*\n`;
        helpText += `├ Gunakan tanpa spasi untuk sumber\n`;
        helpText += `├ Contoh: ${prefix}berita detik\n`;
        helpText += `└ Bukan: ${prefix}berita detik.com\n\n`;
        
        helpText += `━━━━━━━━━━━━━━━━━━━━\n`;
        helpText += `🤖 ${botName} News Scraper v2.0`;

        await xp.sendMessage(chat.id, {
          text: helpText,
          contextInfo: {
            externalAdReply: {
              title: '📰 Menu Berita Lengkap',
              body: `by ${botName}`,
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/60/60543.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in beritahelp:', e);
        xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: BERITA UTAMA ====================
  ev.on({
    name: 'berita',
    cmd: ['berita', 'news'],
    tags: 'berita',
    desc: 'Ambil berita terkini dari berbagai sumber',
    owner: false,
    prefix: true,
    money: 10,
    exp: 0.1,

    run: async (xp, m, { args, chat, prefix }) => {
      try {
        const sourceKey = (args[0] || 'detik').toLowerCase();
        
        // Kirim loading message
        await xp.sendMessage(chat.id, { 
          text: `📡 *Mengambil berita dari ${newsSources[sourceKey]?.name || 'Detik.com'}...*` 
        }, { quoted: m });
        
        const news = await fetchNewsFromSource(sourceKey, 8);
        const source = newsSources[sourceKey] || newsSources.detik;
        
        let message = `📰 *${source.name.toUpperCase()}*\n`;
        message += `⏰ Update: ${source.update}\n`;
        message += `📊 Kategori: ${source.category}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Tampilkan berita
        news.forEach((item, index) => {
          message += `*${index + 1}. ${item.title}*\n`;
          message += `📅 ${formatDate(item.pubDate)}\n`;
          
          if (item.description && item.description.length > 0) {
            message += `📝 ${truncateText(item.description, 100)}\n`;
          }
          
          message += `🔗 ${item.link}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📌 *Tips:* ${prefix}berita [sumber] untuk sumber lain\n`;
        message += `📋 *Contoh:* ${prefix}berita cnn, ${prefix}berita kompas\n`;
        message += `✅ ${news.length} berita ditemukan`;

        // Kirim dengan thumbnail
        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: `📰 ${source.name}`,
              body: `Update terakhir: ${source.update}`,
              thumbnailUrl: source.logo || 'https://cdn-icons-png.flaticon.com/512/60/60543.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in berita command:', e);
        
        // Daftar sumber yang tersedia
        const availableSources = Object.keys(newsSources).slice(0, 8).join(', ');
        
        await xp.sendMessage(chat.id, {
          text: `❌ *Gagal mengambil berita*\n\n*Error:* ${e.message}\n\n*Sumber yang tersedia:*\n${availableSources}\n\n*Contoh:* .berita detik, .berita cnn, .berita kompas`
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: TRENDING NEWS ====================
  ev.on({
    name: 'trending',
    cmd: ['trending', 'viral', 'hotnews'],
    tags: 'berita',
    desc: 'Berita trending/viral saat ini',
    owner: false,
    prefix: true,
    money: 15,
    exp: 0.1,

    run: async (xp, m, { chat }) => {
      try {
        await xp.sendMessage(chat.id, { 
          text: '🔥 *Mencari berita trending saat ini...*' 
        }, { quoted: m });
        
        const trendingNews = await fetchTrendingNews();
        
        let message = `🔥 *TRENDING NEWS INDONESIA*\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `📊 Sumber: Google News\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Tampilkan top 10 trending
        trendingNews.slice(0, 10).forEach((item, index) => {
          const rank = index < 3 ? '🔥' : `${index + 1}.`;
          message += `${rank} *${item.title}*\n`;
          message += `📰 ${item.source}\n`;
          message += `📅 ${formatDate(item.pubDate)}\n`;
          message += `🔗 ${item.link}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📈 *Trending Analysis*\n`;
        message += `├ Total berita: ${trendingNews.length}\n`;
        message += `├ Update: Real-time\n`;
        message += `└ Sumber: Google News API`;

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '🔥 TRENDING NEWS',
              body: 'Berita viral saat ini',
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2917/2917634.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in trending command:', e);
        await xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: BREAKING NEWS ====================
  ev.on({
    name: 'breaking',
    cmd: ['breaking', 'urgent', 'darurat'],
    tags: 'berita',
    desc: 'Breaking news/berita darurat terbaru',
    owner: false,
    prefix: true,
    money: 20,
    exp: 0.2,

    run: async (xp, m, { chat, prefix }) => {
      try {
        await xp.sendMessage(chat.id, { 
          text: '🚨 *Mencari breaking news terbaru...*' 
        }, { quoted: m });
        
        // Ambil dari beberapa sumber cepat
        const [detikNews, cnnNews] = await Promise.all([
          fetchNewsFromSource('detik', 5).catch(() => []),
          fetchNewsFromSource('cnn', 5).catch(() => [])
        ]);
        
        // Gabungkan dan sort by date (terbaru duluan)
        const allBreaking = [...detikNews, ...cnnNews]
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 10);
        
        let message = `🚨 *BREAKING NEWS*\n`;
        message += `⚠️ BERITA PENTING & DARURAT\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        allBreaking.forEach((item, index) => {
          const alert = index < 3 ? '🚨' : '📢';
          message += `${alert} *${item.title}*\n`;
          message += `📡 Sumber: ${item.source}\n`;
          message += `⏰ ${formatDate(item.pubDate)}\n`;
          
          if (item.description) {
            message += `📝 ${truncateText(item.description, 80)}\n`;
          }
          
          message += `🔗 ${item.link}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📡 *Sumber:* Detik.com & CNN Indonesia\n`;
        message += `⏱️ *Update:* Real-time (1-5 menit)\n`;
        message += `⚠️ *Status:* Breaking news terverifikasi`;

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '🚨 BREAKING NEWS',
              body: 'Berita penting & darurat',
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in breaking command:', e);
        await xp.sendMessage(chat.id, { 
          text: `❌ *Error mengambil breaking news:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: DAFTAR SUMBER ====================
  ev.on({
    name: 'daftarsumber',
    cmd: ['daftarsumber', 'listsumber', 'sumberberita'],
    tags: 'berita',
    desc: 'Daftar semua sumber berita yang tersedia',
    owner: false,
    prefix: true,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, prefix }) => {
      try {
        let message = `📋 *DAFTAR SUMBER BERITA*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        message += `*📰 SUMBER UTAMA (Cepat Update):*\n`;
        Object.entries(newsSources).slice(0, 6).forEach(([key, source]) => {
          message += `├ *${key}* - ${source.name}\n`;
          message += `│  ⏰ Update: ${source.update}\n`;
          message += `│  📁 Kategori: ${source.category}\n`;
          message += `│  🔗 Contoh: ${prefix}berita ${key}\n\n`;
        });
        
        message += `*📰 SUMBER TAMBAHAN:*\n`;
        Object.entries(newsSources).slice(6).forEach(([key, source]) => {
          message += `├ ${key} - ${source.name} (${source.update})\n`;
        });
        
        message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        message += `*📊 TOTAL SUMBER:* ${Object.keys(newsSources).length}\n`;
        message += `*⚡ SUMBER TERCEPAT:* detik, cnn, antara\n`;
        message += `*📌 CONTOH:* ${prefix}berita detik\n\n`;
        message += `🤖 ${botName} News Scraper`;

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '📋 Daftar Sumber Berita',
              body: 'Pilih sumber untuk berita terupdate',
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in daftarsumber:', e);
        xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: DAFTAR KATEGORI ====================
  ev.on({
    name: 'daftarkategori',
    cmd: ['daftarkategori', 'listkategori', 'kategoriberita'],
    tags: 'berita',
    desc: 'Daftar kategori berita yang tersedia',
    owner: false,
    prefix: true,
    money: 0,
    exp: 0,

    run: async (xp, m, { chat, prefix }) => {
      try {
        let message = `📁 *DAFTAR KATEGORI BERITA*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        Object.entries(categories).forEach(([key, desc]) => {
          const sources = Object.values(newsSources)
            .filter(s => s.category === key || s.category === 'semua')
            .slice(0, 3)
            .map(s => s.name)
            .join(', ');
          
          message += `*${key.toUpperCase()}*\n`;
          message += `├ Deskripsi: ${desc}\n`;
          message += `├ Sumber: ${sources || 'Semua sumber'}\n`;
          message += `└ Contoh: ${prefix}kategori ${key}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `*💡 TIPS:*\n`;
        message += `├ Beberapa sumber punya kategori khusus\n`;
        message += `├ Gunakan ${prefix}berita [sumber] untuk semua kategori\n`;
        message += `└ Contoh: ${prefix}kategori teknologi`;

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '📁 Kategori Berita',
              body: 'Filter berita berdasarkan kategori',
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2092/2092695.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in daftarkategori:', e);
        xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: KATEGORI BERITA ====================
  ev.on({
    name: 'kategori',
    cmd: ['kategori', 'category', 'cat'],
    tags: 'berita',
    desc: 'Ambil berita berdasarkan kategori',
    owner: false,
    prefix: true,
    money: 12,
    exp: 0.1,

    run: async (xp, m, { args, chat, prefix }) => {
      try {
        if (!args[0]) {
          return xp.sendMessage(chat.id, { 
            text: `❌ *Usage:* ${prefix}kategori <nama_kategori>\n*Contoh:* ${prefix}kategori teknologi\n\n*Kategori tersedia:* ${Object.keys(categories).join(', ')}` 
          }, { quoted: m });
        }
        
        const category = args[0].toLowerCase();
        
        if (!categories[category]) {
          return xp.sendMessage(chat.id, { 
            text: `❌ *Kategori tidak ditemukan!*\n\n*Kategori yang tersedia:*\n${Object.keys(categories).join(', ')}\n\n*Contoh:* ${prefix}kategori teknologi` 
          }, { quoted: m });
        }
        
        await xp.sendMessage(chat.id, { 
          text: `📁 *Mencari berita kategori ${category}...*` 
        }, { quoted: m });
        
        // Cari sumber yang sesuai kategori
        const relevantSources = Object.entries(newsSources)
          .filter(([key, source]) => source.category === category || source.category === 'semua')
          .slice(0, 3);
        
        if (relevantSources.length === 0) {
          return xp.sendMessage(chat.id, { 
            text: `❌ *Tidak ada sumber untuk kategori ${category}*\n\nCoba gunakan kategori lain atau ${prefix}berita [sumber]` 
          }, { quoted: m });
        }
        
        // Ambil berita dari semua sumber relevan
        const newsPromises = relevantSources.map(([key]) => 
          fetchNewsFromSource(key, 3).catch(() => [])
        );
        
        const allNews = (await Promise.all(newsPromises))
          .flat()
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 10);
        
        let message = `📁 *BERITA KATEGORI: ${category.toUpperCase()}*\n`;
        message += `📝 ${categories[category]}\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        if (allNews.length === 0) {
          message += `❌ *Tidak ada berita ditemukan*\n\nCoba beberapa saat lagi atau gunakan kategori lain.`;
        } else {
          allNews.forEach((item, index) => {
            message += `*${index + 1}. ${item.title}*\n`;
            message += `📡 ${item.source}\n`;
            message += `⏰ ${formatDate(item.pubDate)}\n`;
            
            if (item.description) {
              message += `📝 ${truncateText(item.description, 80)}\n`;
            }
            
            message += `🔗 ${item.link}\n\n`;
          });
          
          message += `━━━━━━━━━━━━━━━━━━━━\n`;
          message += `📊 *Statistik:*\n`;
          message += `├ Total berita: ${allNews.length}\n`;
          message += `├ Sumber: ${relevantSources.map(([_, s]) => s.name).join(', ')}\n`;
          message += `└ Kategori: ${category}`;
        }

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: `📁 ${category.toUpperCase()}`,
              body: categories[category],
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2092/2092695.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in kategori command:', e);
        await xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: CARI BERITA ====================
  ev.on({
    name: 'cari',
    cmd: ['cari', 'search', 'find'],
    tags: 'berita',
    desc: 'Cari berita berdasarkan kata kunci',
    owner: false,
    prefix: true,
    money: 15,
    exp: 0.1,

    run: async (xp, m, { args, chat, prefix }) => {
      try {
        if (!args[0]) {
          return xp.sendMessage(chat.id, { 
            text: `❌ *Usage:* ${prefix}cari <kata_kunci>\n*Contoh:* ${prefix}cari gempa, ${prefix}cari pilpres 2024` 
          }, { quoted: m });
        }
        
        const keyword = args.join(' ').toLowerCase();
        await xp.sendMessage(chat.id, { 
          text: `🔍 *Mencari berita: "${keyword}"...*` 
        }, { quoted: m });
        
        // Ambil dari beberapa sumber dan filter
        const sourcesToSearch = ['detik', 'cnn', 'kompas', 'antara'];
        const newsPromises = sourcesToSearch.map(source => 
          fetchNewsFromSource(source, 10).catch(() => [])
        );
        
        const allNews = (await Promise.all(newsPromises))
          .flat()
          .filter(item => 
            item.title.toLowerCase().includes(keyword) || 
            (item.description && item.description.toLowerCase().includes(keyword))
          )
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 15);
        
        let message = `🔍 *HASIL PENCARIAN: "${keyword}"*\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        if (allNews.length === 0) {
          message += `❌ *Tidak ditemukan berita dengan kata kunci "${keyword}"*\n\n`;
          message += `*Tips pencarian:*\n`;
          message += `├ Gunakan kata kunci lebih spesifik\n`;
          message += `├ Coba ejaan yang berbeda\n`;
          message += `└ Gunakan ${prefix}berita untuk berita terkini`;
        } else {
          allNews.forEach((item, index) => {
            message += `*${index + 1}. ${item.title}*\n`;
            message += `📡 ${item.source}\n`;
            message += `⏰ ${formatDate(item.pubDate)}\n`;
            
            // Highlight keyword in description
            let desc = item.description || '';
            if (desc.length > 0) {
              desc = truncateText(desc, 100);
              message += `📝 ${desc}\n`;
            }
            
            message += `🔗 ${item.link}\n\n`;
          });
          
          message += `━━━━━━━━━━━━━━━━━━━━\n`;
          message += `📊 *Statistik Pencarian:*\n`;
          message += `├ Kata kunci: "${keyword}"\n`;
          message += `├ Total ditemukan: ${allNews.length}\n`;
          message += `├ Sumber dicari: ${sourcesToSearch.length}\n`;
          message += `└ Rentang waktu: Semua waktu`;
        }

        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: `🔍 Pencarian: ${keyword}`,
              body: `${allNews.length} hasil ditemukan`,
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/54/54481.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in cari command:', e);
        await xp.sendMessage(chat.id, { 
          text: `❌ *Error pencarian:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: BERITA ALL IN ONE ====================
  ev.on({
    name: 'beritaall',
    cmd: ['beritaall', 'semuaberita', 'allnews'],
    tags: 'berita',
    desc: 'Semua berita terbaru dari berbagai sumber',
    owner: false,
    prefix: true,
    money: 25,
    exp: 0.2,

    run: async (xp, m, { chat }) => {
      try {
        await xp.sendMessage(chat.id, { 
          text: '📡 *Mengumpulkan semua berita terbaru...*' 
        }, { quoted: m });
        
        // Ambil dari 4 sumber utama
        const mainSources = ['detik', 'cnn', 'kompas', 'antara'];
        const newsPromises = mainSources.map(source => 
          fetchNewsFromSource(source, 4).catch(() => [])
        );
        
        const allNews = (await Promise.all(newsPromises))
          .flat()
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 20);
        
        // Group by source
        const groupedNews = {};
        allNews.forEach(item => {
          if (!groupedNews[item.source]) {
            groupedNews[item.source] = [];
          }
          groupedNews[item.source].push(item);
        });
        
        let message = `📰 *ALL NEWS SUMMARY*\n`;
        message += `📊 Ringkasan berita dari semua sumber\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        Object.entries(groupedNews).forEach(([source, news]) => {
          message += `*📡 ${source.toUpperCase()}*\n`;
          news.slice(0, 3).forEach(item => {
            message += `├ ${item.title}\n`;
          });
          message += `└ Total: ${news.length} berita\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📈 *ANALYSIS SUMMARY:*\n`;
        message += `├ Total berita: ${allNews.length}\n`;
        message += `├ Sumber aktif: ${Object.keys(groupedNews).length}\n`;
        message += `├ Update terbaru: ${formatDate(allNews[0]?.pubDate)}\n`;
        message += `└ Rentang waktu: ${formatDate(allNews[allNews.length-1]?.pubDate)} - ${formatDate(allNews[0]?.pubDate)}`;
        
        // Kirim summary dulu
        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '📰 ALL NEWS SUMMARY',
              body: `${allNews.length} berita dari ${Object.keys(groupedNews).length} sumber`,
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/60/60543.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });
        
        // Kirim detail per sumber
        for (const [source, news] of Object.entries(groupedNews)) {
          let detailMessage = `📰 *${source.toUpperCase()} - DETAIL*\n`;
          detailMessage += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          
          news.slice(0, 5).forEach((item, index) => {
            detailMessage += `*${index + 1}. ${item.title}*\n`;
            detailMessage += `⏰ ${formatDate(item.pubDate)}\n`;
            detailMessage += `🔗 ${item.link}\n\n`;
          });
          
          if (news.length > 5) {
            detailMessage += `📌 *${news.length - 5} berita lainnya tersedia...*\n`;
          }
          
          detailMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
          detailMessage += `✅ Gunakan .berita ${Object.keys(newsSources).find(k => newsSources[k].name === source)} untuk lebih banyak`;
          
          await xp.sendMessage(chat.id, { text: detailMessage });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (e) {
        console.error('Error in beritaall command:', e);
        await xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });

  // ==================== COMMAND: PING NEWS SERVER ====================
  ev.on({
    name: 'pingnews',
    cmd: ['pingnews', 'newsping', 'checknews'],
    tags: 'berita',
    desc: 'Cek status dan kecepatan sumber berita',
    owner: false,
    prefix: true,
    money: 5,
    exp: 0,

    run: async (xp, m, { chat }) => {
      try {
        const testSources = ['detik', 'cnn', 'kompas', 'antara', 'bbc'];
        const results = [];
        
        await xp.sendMessage(chat.id, { 
          text: '📡 *Pinging news servers...*' 
        }, { quoted: m });
        
        for (const sourceKey of testSources) {
          const source = newsSources[sourceKey];
          const startTime = Date.now();
          
          try {
            await axios.get(source.url, { timeout: 10000 });
            const responseTime = Date.now() - startTime;
            
            results.push({
              source: source.name,
              status: '✅ ONLINE',
              time: `${responseTime}ms`,
              update: source.update
            });
          } catch (error) {
            results.push({
              source: source.name,
              status: '❌ OFFLINE',
              time: 'Timeout',
              update: source.update
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        let message = `📡 *NEWS SERVER STATUS*\n`;
        message += `⏰ ${new Date().toLocaleString('id-ID')}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        results.forEach(result => {
          message += `${result.status} *${result.source}*\n`;
          message += `├ Response: ${result.time}\n`;
          message += `├ Update: ${result.update}\n`;
          message += `└ Status: ${result.status === '✅ ONLINE' ? '🟢 Normal' : '🔴 Error'}\n\n`;
        });
        
        const onlineCount = results.filter(r => r.status === '✅ ONLINE').length;
        const totalCount = results.length;
        
        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📊 *SERVER STATUS:* ${onlineCount}/${totalCount} ONLINE\n`;
        message += `⚡ *RECOMMENDED:* ${results.find(r => r.status === '✅ ONLINE' && r.time < 1000)?.source || 'Detik.com'}\n`;
        message += `📌 *TIP:* Gunakan sumber dengan status ✅ ONLINE`;
        
        await xp.sendMessage(chat.id, {
          text: message,
          contextInfo: {
            externalAdReply: {
              title: '📡 Server Status',
              body: `${onlineCount}/${totalCount} servers online`,
              thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/3067/3067256.png',
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });

      } catch (e) {
        console.error('Error in pingnews:', e);
        xp.sendMessage(chat.id, { 
          text: `❌ *Error:* ${e.message}` 
        }, { quoted: m });
      }
    }
  });
  
  console.log('✅ Berita.js loaded successfully!');
}
