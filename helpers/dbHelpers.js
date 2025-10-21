const TrafficData = require('../models/trafficData');
const WebsiteMetadata = require('../models/websiteMetadata');
const User = require('../models/user');
const Payment = require('../models/payment');

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

// Credit Management Functions
const CREDITS_PER_REQUEST = 10;

const checkAndDeductCredits = async (userId, requestType = 'campaign') => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Reset daily requests if it's a new day
        const today = new Date().toDateString();
        const lastReset = user.lastResetDate?.toDateString();
        if (lastReset !== today) {
            user.dailyRequestsUsed = 0;
            user.lastResetDate = new Date();
        }

        // Check daily limit for free users
        if (user.planType === 'free' && user.dailyRequestsUsed >= user.dailyRequestLimit) {
            throw new Error('Daily request limit reached. Please upgrade your plan or try again tomorrow.');
        }

        // Check if user has enough credits
        if (user.credits < CREDITS_PER_REQUEST && user.planType !== 'unlimited') {
            throw new Error('Insufficient credits. Please purchase more credits or upgrade your plan.');
        }

        // Deduct credits (skip for unlimited plan)
        if (user.planType !== 'unlimited') {
            user.credits -= CREDITS_PER_REQUEST;
            user.totalCreditsUsed += CREDITS_PER_REQUEST;
        }

        // Increment daily requests
        user.dailyRequestsUsed += 1;
        await user.save();

        return {
            success: true,
            remainingCredits: user.credits,
            dailyRequestsRemaining: user.dailyRequestLimit - user.dailyRequestsUsed
        };
    } catch (error) {
        console.error('Error checking and deducting credits:', error);
        throw error;
    }
};

const addCredits = async (userId, credits, planType = null) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.credits += credits;
        
        if (planType && planType !== 'free') {
            user.planType = planType;
            user.isPaymentActive = true;
            
            // Set plan expiry date (30 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            user.paymentExpiryDate = expiryDate;
            
            // Set plan-specific details
            const planDetails = getPlanDetails(planType);
            user.planPrice = planDetails.price;
            user.planCredits = credits;
            
            // Update daily limits based on plan
            if (planType === 'unlimited') {
                user.dailyRequestLimit = 999999; // Effectively unlimited
            } else {
                user.dailyRequestLimit = 50; // Higher limit for paid plans
            }
        }

        await user.save();
        return user;
    } catch (error) {
        console.error('Error adding credits:', error);
        throw error;
    }
};

const getUserCredits = async (userId) => {
    try {
        const user = await User.findById(userId).select('credits totalCreditsUsed planType dailyRequestLimit dailyRequestsUsed lastResetDate isPaymentActive paymentExpiryDate');
        if (!user) {
            throw new Error('User not found');
        }

        // Reset daily requests if it's a new day
        const today = new Date().toDateString();
        const lastReset = user.lastResetDate?.toDateString();
        if (lastReset !== today) {
            user.dailyRequestsUsed = 0;
            user.lastResetDate = new Date();
            await user.save();
        }

        return {
            credits: user.credits,
            totalCreditsUsed: user.totalCreditsUsed,
            planType: user.planType,
            dailyRequestLimit: user.dailyRequestLimit,
            dailyRequestsUsed: user.dailyRequestsUsed,
            dailyRequestsRemaining: user.dailyRequestLimit - user.dailyRequestsUsed,
            isPaymentActive: user.isPaymentActive,
            paymentExpiryDate: user.paymentExpiryDate
        };
    } catch (error) {
        console.error('Error getting user credits:', error);
        throw error;
    }
};

const getPlanDetails = (planType) => {
    const plans = {
        free: { credits: 50, price: 0, dailyLimit: 5 },
        basic: { credits: 4000, price: 2000, dailyLimit: 50 },
        premium: { credits: 10000, price: 4000, dailyLimit: 100 },
        unlimited: { credits: -1, price: 7500, dailyLimit: 999999 }
    };
    return plans[planType] || plans.free;
};

const createPaymentRecord = async (userId, planType, credits, amount, paymentData = {}) => {
    try {
        const payment = new Payment({
            userId,
            planType,
            creditsPurchased: credits,
            pricePaid: amount,
            paymentId: paymentData.paymentId || null,
            paymentStatus: paymentData.status || 'pending',
            paymentMethod: paymentData.method || 'online',
            transactionId: paymentData.transactionId || null,
            gatewayResponse: paymentData.gatewayResponse || {},
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        await payment.save();
        return payment;
    } catch (error) {
        console.error('Error creating payment record:', error);
        throw error;
    }
};

const updatePaymentStatus = async (paymentId, status, gatewayResponse = {}) => {
    try {
        const payment = await Payment.findOneAndUpdate(
            { paymentId },
            { 
                paymentStatus: status,
                gatewayResponse: gatewayResponse
            },
            { new: true }
        );
        return payment;
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

const getUserPaymentHistory = async (userId) => {
    try {
        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 })
            .select('planType creditsPurchased pricePaid paymentStatus paymentDate expiryDate');
        return payments;
    } catch (error) {
        console.error('Error getting payment history:', error);
        throw error;
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
    deleteWebsiteMetadata,
    // Credit management
    checkAndDeductCredits,
    addCredits,
    getUserCredits,
    getPlanDetails,
    createPaymentRecord,
    updatePaymentStatus,
    getUserPaymentHistory,
    CREDITS_PER_REQUEST
};
