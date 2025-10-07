const TrafficData = require('../models/trafficData');
const WebsiteMetadata = require('../models/websiteMetadata');

const storeTrafficData = async ({ userId, keyword, website, country, rank = 0, hits = 0 }) => {
    try {
        const trafficData = new TrafficData({ userId, keyword, website, country, rank, hits });
        await trafficData.save();
        console.log('Successfully stored traffic data');
    } catch (error) {
        console.error('Error storing traffic data:', error);
    }
};

const updateTrafficDataHits = async (userId, keyword, website, country, hits) => {
    try {
        const trafficData = await TrafficData.findOne({ userId, keyword, website, country });
        if (trafficData) {
            trafficData.hits += hits;
            const currentDate = new Date().toISOString().split('T')[0];
            trafficData.hitsByDate.set(currentDate, (trafficData.hitsByDate.get(currentDate) || 0) + hits);
            await trafficData.save();
            console.log('Successfully updated traffic hits');
        } else {
            console.log('Traffic data not found for the specified criteria');
        }
    } catch (error) {
        console.error('Error updating traffic hits:', error);
    }
};

const updateTrafficDataRank = async (userId, keyword, website, country, rank) => {
    try {
        const trafficData = await TrafficData.findOne({ userId, keyword, website, country });
        if (trafficData) {
            trafficData.rank = rank;
            await trafficData.save();
            console.log('Successfully updated traffic rank');
        } else {
            console.log('Traffic data not found for the specified criteria');
        }
    } catch (error) {
        console.error('Error updating traffic rank:', error);
    }
};

// SEO Metadata Functions
const storeWebsiteMetadata = async (userId, keyword, website, metadata) => {
    try {
        const existingMetadata = await WebsiteMetadata.findOne({ 
            userId, 
            website, 
            keyword 
        });
        
        if (existingMetadata) {
            // Update existing metadata
            Object.assign(existingMetadata, metadata);
            existingMetadata.lastAnalyzed = new Date();
            await existingMetadata.save();
            console.log('Successfully updated website metadata');
        } else {
            // Create new metadata
            const websiteMetadata = new WebsiteMetadata({
                userId,
                keyword,
                website,
                ...metadata
            });
            await websiteMetadata.save();
            console.log('Successfully stored website metadata');
        }
    } catch (error) {
        console.error('Error storing website metadata:', error);
    }
};

const updateTrafficDataWithSEO = async (userId, keyword, website, country, seoData) => {
    try {
        const trafficData = await TrafficData.findOne({ userId, keyword, website, country });
        if (trafficData) {
            // Update basic SEO metadata in TrafficData
            if (seoData.title) trafficData.seoMetadata.title = seoData.title;
            if (seoData.description) trafficData.seoMetadata.description = seoData.description;
            if (seoData.keywords) trafficData.seoMetadata.keywords = seoData.keywords;
            if (seoData.h1Tags) trafficData.seoMetadata.h1Tags = seoData.h1Tags;
            if (seoData.h2Tags) trafficData.seoMetadata.h2Tags = seoData.h2Tags;
            if (seoData.h3Tags) trafficData.seoMetadata.h3Tags = seoData.h3Tags;
            if (seoData.imageCount) trafficData.seoMetadata.imageCount = seoData.imageCount;
            if (seoData.internalLinks) trafficData.seoMetadata.internalLinks = seoData.internalLinks;
            if (seoData.externalLinks) trafficData.seoMetadata.externalLinks = seoData.externalLinks;
            if (seoData.wordCount) trafficData.seoMetadata.wordCount = seoData.wordCount;
            if (seoData.pageLoadTime) trafficData.seoMetadata.pageLoadTime = seoData.pageLoadTime;
            if (seoData.hasSchema) trafficData.seoMetadata.hasSchema = seoData.hasSchema;
            if (seoData.schemaTypes) trafficData.seoMetadata.schemaTypes = seoData.schemaTypes;
            
            trafficData.lastAnalyzed = new Date();
            trafficData.seoMetadata.lastUpdated = new Date();
            await trafficData.save();
            console.log('Successfully updated traffic data with SEO metadata');
        } else {
            console.log('Traffic data not found for SEO update');
        }
    } catch (error) {
        console.error('Error updating traffic data with SEO:', error);
    }
};

const getWebsiteMetadata = async (userId, website, keyword) => {
    try {
        const metadata = await WebsiteMetadata.findOne({ userId, website, keyword });
        return metadata;
    } catch (error) {
        console.error('Error getting website metadata:', error);
        return null;
    }
};

const getAllUserMetadata = async (userId) => {
    try {
        const metadata = await WebsiteMetadata.find({ userId }).sort({ lastAnalyzed: -1 });
        return metadata;
    } catch (error) {
        console.error('Error getting user metadata:', error);
        return [];
    }
};

const deleteWebsiteMetadata = async (userId, website, keyword) => {
    try {
        const result = await WebsiteMetadata.findOneAndDelete({ userId, website, keyword });
        console.log('Successfully deleted website metadata');
        return result;
    } catch (error) {
        console.error('Error deleting website metadata:', error);
        return null;
    }
};

module.exports = {
    storeTrafficData,
    updateTrafficDataHits,
    updateTrafficDataRank,
    storeWebsiteMetadata,
    updateTrafficDataWithSEO,
    getWebsiteMetadata,
    getAllUserMetadata,
    deleteWebsiteMetadata
};
