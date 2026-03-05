// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    // Asosiy ma'lumotlar
    title: { type: String, required: true },
    content: { type: String, required: true },
    
    // YANGA QO'SHILGAN MAYDONLAR:
    // Maqolaning muqova rasmi (URL ssilka ko'rinishida saqlaymiz)
    imageUrl: { type: String, default: 'https://via.placeholder.com/800x400?text=Kompyuter+Savodxonligi' },
    
    // Maqola kategoriyasi (masalan: "Dasturlash", "Xavfsizlik", "Boshlang'ich")
    category: { type: String, default: 'Umumiy' },
    
    // Odamlar necha marta o'qiganini sanash uchun
    views: { type: Number, default: 0 },

    // Teglar va vaqt (Eskilari)
    tags: { type: [String], default: [] },
    publishedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);