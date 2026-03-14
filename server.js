require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dns = require("dns");

// Modellarni chaqirish
const Article = require("./models/Article");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000; // Render o'zi port beradi
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
const JWT_SECRET = process.env.JWT_SECRET || "maxfiy_kalit_123"; // .env da bo'lishi tavsiya etiladi

// DNS sozlamasi
dns.setServers(["1.1.1.1"]);

// Middleware
app.use(cors());
app.use(express.json());

// 0. BAZAGA ULANISH
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bazasiga muvaffaqiyatli ulandi! 🗄️"))
  .catch((err) => console.log("Bazaga ulanishda xatolik:", err));

// ==========================================
// 🛡️ AUTH MIDDLEWARE (Yo'nalishlardan tepada turishi shart!)
// ==========================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token)
    return res.status(401).json({ message: "Ruxsat yo'q (Token topilmadi)!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token yaroqsiz yoki muddati o'tgan!" });
  }
};

// ==========================================
// 🔑 AUTH ROUTES (Login va Register)
// ==========================================

// app.post("/api/auth/register", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashedPassword });
//     await user.save();
//     res.json({ message: "Admin yaratildi!" });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Ro'yxatdan o'tishda xato", error: err.message });
//   }
// });

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "2h" });
      res.json({ token });
    } else {
      res.status(401).json({ message: "Login yoki parol xato!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Serverda xatolik" });
  }
});

// ==========================================
// 📝 ARTICLE ROUTES
// ==========================================

// 1. Maqola yaratish (Himoyalangan)
app.post("/api/articles", authMiddleware, async (req, res) => {
  try {
    const newArticle = new Article(req.body);
    const savedArticle = await newArticle.save();
    res.status(201).json(savedArticle);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Maqola yaratishda xatolik", error: err.message });
  }
});

// 2. Hammasini olish va Qidiruv
app.get("/api/articles", async (req, res) => {
  try {
    const { tag, search } = req.query;
    let query = {};

    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await Article.find(query).sort({ publishedDate: -1 });
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
});

// 3. ID bo'yicha olish (Ko'rishlar sonini oshirish bilan)
app.get("/api/articles/:id", async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // Ko'rishlar sonini atomik oshirish
      { new: true },
    );

    if (!article)
      return res.status(404).json({ message: "Maqola topilmadi 😔" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: "Xatolik", error: err.message });
  }
});

// 4. Tahrirlash (Himoyalangan)
app.put("/api/articles/:id", authMiddleware, async (req, res) => {
  try {
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedArticle)
      return res.status(404).json({ message: "Maqola topilmadi" });
    res.status(200).json(updatedArticle);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Tahrirlashda xatolik", error: err.message });
  }
});

// 5. O'chirish (Himoyalangan)
app.delete("/api/articles/:id", authMiddleware, async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);
    if (!deletedArticle)
      return res.status(404).json({ message: "Maqola topilmadi" });
    res.status(200).json({ message: "Maqola muvaffaqiyatli o'chirildi" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "O'chirishda xatolik", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishga tushdi 🚀`);
});
