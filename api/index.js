const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fmc-comic.vercel.app',
    'https://*.vercel.app',
    'https://fmc-comic-v2.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'FMC Comic API',
    version: '2.0.0'
  });
});

const connectionOptions = {
    serverSelectionTimeoutMS: 5000, 
    socketTimeoutMS: 45000,
};

const MappingSchema = new mongoose.Schema({
    uuid: { type: String, unique: true },
    slug: String,
    type: String
});
const Mapping = mongoose.models.Mapping || mongoose.model('Mapping', MappingSchema);

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) return;
    
    console.log("Mencoba menyambung ke MongoDB...");
    try {
        await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        console.log("✅ Database Terhubung!");
    } catch (err) {
        console.error("❌ Gagal menyambung ke DB:", err.message);
        throw err;
    }
}

app.post('/api/get-id', async (req, res) => {
    try {
        await connectToDatabase();
        
        const { slug, type } = req.body;
        if (!slug || !type) return res.status(400).json({ error: "Slug/Type kurang" });

        console.log(`Mencari mapping untuk: ${slug} (${type})`);
        
        let data = await Mapping.findOne({ slug, type });
        if (!data) {
            console.log("Mapping tidak ditemukan, membuat UUID baru...");
            data = await Mapping.create({ uuid: uuidv4(), slug, type });
        }
        
        return res.json({ uuid: data.uuid });
    } catch (e) {
        console.error("Internal Error @ get-id:", e.message);
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/get-slug/:uuid', async (req, res) => {
    try {
        await connectToDatabase();
        const data = await Mapping.findOne({ uuid: req.params.uuid });
        if (data) return res.json(data);
        return res.status(404).json({ error: "UUID tidak ada di database" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        await connectToDatabase();
        res.json({ status: "OK", database: "Connected" });
    } catch (e) {
        res.status(500).json({ status: "Error", message: e.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
