// models/trafficData.js
const mongoose = require('mongoose');

const TrafficDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    keyword: { type: String, required: true },
    website: { type: String, required: true },
    country: { type: String, required: true },
    rank: { type: Number, default: null },
    hits: { type: Number, default: 0 },
    hitsByDate: { type: Map, of: Number, default: {} },
    lastAnalyzed: { type: Date, default: null },
    seoMetadata: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        keywords: { type: String, default: '' },
        canonical: { type: String, default: '' },
        robots: { type: String, default: '' },
        ogTitle: { type: String, default: '' },
        ogDescription: { type: String, default: '' },
        ogImage: { type: String, default: '' },
        twitterTitle: { type: String, default: '' },
        twitterDescription: { type: String, default: '' },
        twitterImage: { type: String, default: '' },
        h1Tags: [{ type: String }],
        h2Tags: [{ type: String }],
        h3Tags: [{ type: String }],
        imageCount: { type: Number, default: 0 },
        internalLinks: { type: Number, default: 0 },
        externalLinks: { type: Number, default: 0 },
        wordCount: { type: Number, default: 0 },
        pageLoadTime: { type: Number, default: 0 },
        hasSchema: { type: Boolean, default: false },
        schemaTypes: [{ type: String }],
        lastUpdated: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.TrafficData || mongoose.model('TrafficData', TrafficDataSchema);
