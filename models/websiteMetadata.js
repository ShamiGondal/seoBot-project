// models/websiteMetadata.js
const mongoose = require('mongoose');

const WebsiteMetadataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    website: { type: String, required: true },
    keyword: { type: String, required: true },
    
    // Basic Meta Tags
    metaTags: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        keywords: { type: String, default: '' },
        author: { type: String, default: '' },
        viewport: { type: String, default: '' },
        charset: { type: String, default: '' },
        language: { type: String, default: '' },
        canonical: { type: String, default: '' },
        robots: { type: String, default: '' },
        refresh: { type: String, default: '' }
    },
    
    // Open Graph Tags
    openGraph: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        image: { type: String, default: '' },
        url: { type: String, default: '' },
        type: { type: String, default: '' },
        siteName: { type: String, default: '' },
        locale: { type: String, default: '' }
    },
    
    // Twitter Card Tags
    twitterCard: {
        card: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        image: { type: String, default: '' },
        creator: { type: String, default: '' },
        site: { type: String, default: '' }
    },
    
    // Heading Structure
    headings: {
        h1: [{ type: String }],
        h2: [{ type: String }],
        h3: [{ type: String }],
        h4: [{ type: String }],
        h5: [{ type: String }],
        h6: [{ type: String }]
    },
    
    // Content Analysis
    contentAnalysis: {
        wordCount: { type: Number, default: 0 },
        paragraphCount: { type: Number, default: 0 },
        imageCount: { type: Number, default: 0 },
        videoCount: { type: Number, default: 0 },
        internalLinks: { type: Number, default: 0 },
        externalLinks: { type: Number, default: 0 },
        brokenLinks: { type: Number, default: 0 },
        duplicateContent: { type: Boolean, default: false }
    },
    
    // Technical SEO
    technicalSEO: {
        pageLoadTime: { type: Number, default: 0 },
        pageSize: { type: Number, default: 0 },
        hasSchema: { type: Boolean, default: false },
        schemaTypes: [{ type: String }],
        hasSitemap: { type: Boolean, default: false },
        hasRobotsTxt: { type: Boolean, default: false },
        sslEnabled: { type: Boolean, default: false },
        mobileFriendly: { type: Boolean, default: false },
        responsiveDesign: { type: Boolean, default: false }
    },
    
    // Images Analysis
    images: [{
        src: { type: String },
        alt: { type: String },
        title: { type: String },
        width: { type: Number },
        height: { type: Number },
        hasAlt: { type: Boolean, default: false },
        isOptimized: { type: Boolean, default: false }
    }],
    
    // Links Analysis
    links: {
        internal: [{ 
            url: { type: String },
            text: { type: String },
            title: { type: String }
        }],
        external: [{ 
            url: { type: String },
            text: { type: String },
            title: { type: String },
            nofollow: { type: Boolean, default: false }
        }]
    },
    
    // Performance Metrics
    performance: {
        loadTime: { type: Number, default: 0 },
        domContentLoaded: { type: Number, default: 0 },
        firstContentfulPaint: { type: Number, default: 0 },
        largestContentfulPaint: { type: Number, default: 0 },
        cumulativeLayoutShift: { type: Number, default: 0 },
        firstInputDelay: { type: Number, default: 0 }
    },
    
    // SEO Score
    seoScore: {
        overall: { type: Number, default: 0 },
        technical: { type: Number, default: 0 },
        content: { type: Number, default: 0 },
        onPage: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        accessibility: { type: Number, default: 0 }
    },
    
    // Analysis Status
    analysisStatus: {
        completed: { type: Boolean, default: false },
        errors: [{ type: String }],
        warnings: [{ type: String }],
        recommendations: [{ type: String }]
    },
    
    lastAnalyzed: { type: Date, default: Date.now },
    analysisVersion: { type: String, default: '1.0' }
}, {
    timestamps: true
});

// Indexes for better performance
WebsiteMetadataSchema.index({ userId: 1, website: 1, keyword: 1 });
WebsiteMetadataSchema.index({ lastAnalyzed: -1 });

module.exports = mongoose.models.WebsiteMetadata || mongoose.model('WebsiteMetadata', WebsiteMetadataSchema);
