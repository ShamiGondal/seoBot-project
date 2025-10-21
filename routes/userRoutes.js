const express = require('express');
const User = require('../models/user');
const TrafficData = require('../models/trafficData');
const WebsiteMetadata = require('../models/websiteMetadata');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/authMiddleware');
const { 
    storeWebsiteMetadata, 
    updateTrafficDataWithSEO, 
    getWebsiteMetadata, 
    getAllUserMetadata, 
    deleteWebsiteMetadata,
    checkAndDeductCredits,
    addCredits,
    getUserCredits,
    getPlanDetails,
    createPaymentRecord,
    updatePaymentStatus,
    getUserPaymentHistory,
    CREDITS_PER_REQUEST
} = require('../helpers/dbHelpers');
const Payment = require('../models/payment');

const router = express.Router();


// Endpoint to create or update traffic data
router.post('/update-traffic', authenticate, async (req, res) => {
    const { keyword, website, country, hitsByDate } = req.body;
    const userId = req.user.id;

    try {
        const trafficData = await TrafficData.findOneAndUpdate(
            { userId },
            { keyword, website, country, hitsByDate },
            { new: true, upsert: true }
        );

        res.status(200).send(trafficData);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.delete('/delete-traffic', authenticate, async (req, res) => {
    const { keyword, website, country } = req.body;
    const userId = req.user.id;

    try {
        const trafficData = await TrafficData.findOneAndDelete({
            userId,
            keyword,
            website,
            country
        });

        if (!trafficData) {
            return res.status(404).send('Traffic data not found');
        }

        res.status(200).send({ message: 'Traffic data deleted successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1d' });
        res.status(201).send({ message: 'User created successfully', token });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1d' });
        res.status(200).send({ token });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.post('/subscribe', authenticate, async (req, res) => {
    const { planType } = req.body;
    const userId = req.user.id;

    const validPlans = ['free', 'basic', 'premium', 'unlimited'];
    if (!validPlans.includes(planType)) {
        return res.status(400).send('Invalid plan type');
    }

    try {
        await User.findByIdAndUpdate(userId, { 
            subscription: planType,
            planType: planType
        });
        res.status(200).send({ message: 'Subscription updated successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
});
router.get('/user-info', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('username email');
        const trafficData = await TrafficData.find({ userId }).select('keyword website country rank hits hitsByDate');

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (!trafficData.length) {
            return res.status(404).send('Traffic data not found');
        }

        const userInfo = {
            username: user.username,
            email: user.email,
            trafficData: trafficData.map(data => ({
                keyword: data.keyword,
                website: data.website,
                country: data.country,
                rank: data.rank,
                hits: data.hits,
                hitsByDate: data.hitsByDate
            }))
        };
        //console.log(userInfo);
        res.status(200).send(userInfo);
    } catch (error) {
        res.status(400).send(error.message);
    }
});




router.get('/hits-by-date', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const trafficData = await TrafficData.findOne({ userId }).select('hitsByDate');

        if (!trafficData) {
            return res.status(404).send('Traffic data not found');
        }

        res.status(200).send(trafficData.hitsByDate);
    } catch (error) {
        res.status(400).send(error.message);
    }
});
// New route to get username and email from token
router.get('/get-username', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('username email');
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send({ username: user.username, email: user.email });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// SEO Metadata Routes

// Get all SEO metadata for a user
router.get('/seo-metadata', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const metadata = await getAllUserMetadata(userId);
        res.status(200).send(metadata);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get specific website SEO metadata
router.get('/seo-metadata/:website/:keyword', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { website, keyword } = req.params;

    try {
        const metadata = await getWebsiteMetadata(userId, website, keyword);
        if (!metadata) {
            return res.status(404).send('SEO metadata not found');
        }
        res.status(200).send(metadata);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update SEO metadata for a website
router.post('/seo-metadata', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { keyword, website, metadata } = req.body;

    try {
        await storeWebsiteMetadata(userId, keyword, website, metadata);
        res.status(200).send({ message: 'SEO metadata stored successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete SEO metadata
router.delete('/seo-metadata/:website/:keyword', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { website, keyword } = req.params;

    try {
        const result = await deleteWebsiteMetadata(userId, website, keyword);
        if (!result) {
            return res.status(404).send('SEO metadata not found');
        }
        res.status(200).send({ message: 'SEO metadata deleted successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get comprehensive SEO report for a website
router.get('/seo-report/:website/:keyword', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { website, keyword } = req.params;

    try {
        // Get traffic data with SEO metadata
        const trafficData = await TrafficData.findOne({ userId, website, keyword });
        
        // Get detailed website metadata
        const websiteMetadata = await getWebsiteMetadata(userId, website, keyword);

        if (!trafficData && !websiteMetadata) {
            return res.status(404).send('No data found for this website and keyword');
        }

        const report = {
            basic: {
                website,
                keyword,
                rank: trafficData?.rank || null,
                hits: trafficData?.hits || 0,
                lastAnalyzed: trafficData?.lastAnalyzed || websiteMetadata?.lastAnalyzed
            },
            seoMetadata: trafficData?.seoMetadata || {},
            detailedMetadata: websiteMetadata || {},
            summary: {
                hasTitle: !!(trafficData?.seoMetadata?.title || websiteMetadata?.metaTags?.title),
                hasDescription: !!(trafficData?.seoMetadata?.description || websiteMetadata?.metaTags?.description),
                hasH1: !!(trafficData?.seoMetadata?.h1Tags?.length || websiteMetadata?.headings?.h1?.length),
                hasImages: !!(trafficData?.seoMetadata?.imageCount || websiteMetadata?.contentAnalysis?.imageCount),
                hasSchema: !!(trafficData?.seoMetadata?.hasSchema || websiteMetadata?.technicalSEO?.hasSchema),
                wordCount: trafficData?.seoMetadata?.wordCount || websiteMetadata?.contentAnalysis?.wordCount || 0,
                internalLinks: trafficData?.seoMetadata?.internalLinks || websiteMetadata?.contentAnalysis?.internalLinks || 0,
                externalLinks: trafficData?.seoMetadata?.externalLinks || websiteMetadata?.contentAnalysis?.externalLinks || 0
            }
        };

        res.status(200).send(report);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get SEO analytics dashboard data
router.get('/seo-analytics', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const trafficData = await TrafficData.find({ userId }).select('keyword website country rank hits seoMetadata lastAnalyzed');
        const websiteMetadata = await getAllUserMetadata(userId);

        const analytics = {
            totalWebsites: trafficData.length,
            totalKeywords: [...new Set(trafficData.map(t => t.keyword))].length,
            averageRank: trafficData.filter(t => t.rank).reduce((sum, t) => sum + t.rank, 0) / trafficData.filter(t => t.rank).length || 0,
            totalHits: trafficData.reduce((sum, t) => sum + t.hits, 0),
            seoStats: {
                withTitle: trafficData.filter(t => t.seoMetadata?.title).length,
                withDescription: trafficData.filter(t => t.seoMetadata?.description).length,
                withH1: trafficData.filter(t => t.seoMetadata?.h1Tags?.length).length,
                withSchema: trafficData.filter(t => t.seoMetadata?.hasSchema).length,
                analyzedWebsites: websiteMetadata.length
            },
            recentAnalysis: websiteMetadata.slice(0, 5).map(w => ({
                website: w.website,
                keyword: w.keyword,
                lastAnalyzed: w.lastAnalyzed,
                seoScore: w.seoScore?.overall || 0
            }))
        };

        res.status(200).send(analytics);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Payment and Credit Management Routes

// Get user credits and plan information
router.get('/credits', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const creditsInfo = await getUserCredits(userId);
        const planDetails = getPlanDetails(creditsInfo.planType);
        
        res.status(200).send({
            ...creditsInfo,
            planDetails,
            creditsPerRequest: CREDITS_PER_REQUEST
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get available plans
router.get('/plans', authenticate, async (req, res) => {
    try {
        const plans = {
            free: {
                name: 'Free',
                price: 0,
                credits: 50,
                dailyLimit: 5,
                description: 'Perfect for testing'
            },
            basic: {
                name: 'Basic',
                price: 2000,
                credits: 4000,
                dailyLimit: 50,
                description: 'Great for small businesses'
            },
            premium: {
                name: 'Premium',
                price: 4000,
                credits: 10000,
                dailyLimit: 100,
                description: 'Perfect for growing businesses'
            },
            unlimited: {
                name: 'Unlimited',
                price: 7500,
                credits: -1,
                dailyLimit: 999999,
                description: 'For serious marketers'
            }
        };

        res.status(200).send(plans);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Create payment intent (simulate payment initiation)
router.post('/create-payment', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { planType } = req.body;

    const validPlans = ['basic', 'premium', 'unlimited'];
    if (!validPlans.includes(planType)) {
        return res.status(400).send('Invalid plan type');
    }

    try {
        const planDetails = getPlanDetails(planType);
        const paymentId = `pay_${Date.now()}_${userId}`;
        
        // Create payment record
        const payment = await createPaymentRecord(
            userId,
            planType,
            planDetails.credits,
            planDetails.price,
            {
                paymentId,
                status: 'pending',
                method: 'online'
            }
        );

        res.status(200).send({
            paymentId,
            amount: planDetails.price,
            credits: planDetails.credits,
            planType,
            message: 'Payment created successfully'
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Confirm payment (simulate payment completion)
router.post('/confirm-payment', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { paymentId, transactionId } = req.body;

    if (!paymentId) {
        return res.status(400).send('Payment ID is required');
    }

    try {
        // Find the payment record
        const payment = await Payment.findOne({ paymentId, userId });
        if (!payment) {
            return res.status(404).send('Payment not found');
        }

        if (payment.paymentStatus === 'completed') {
            return res.status(400).send('Payment already completed');
        }

        // Update payment status
        await updatePaymentStatus(paymentId, 'completed', {
            transactionId,
            confirmedAt: new Date()
        });

        // Add credits to user account
        await addCredits(userId, payment.creditsPurchased, payment.planType);

        res.status(200).send({
            message: 'Payment confirmed successfully',
            creditsAdded: payment.creditsPurchased,
            planType: payment.planType
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get payment history
router.get('/payment-history', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const payments = await getUserPaymentHistory(userId);
        res.status(200).send(payments);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Check if user can create campaign (credit check)
router.get('/can-create-campaign', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        const creditsInfo = await getUserCredits(userId);
        
        const canCreate = creditsInfo.credits >= CREDITS_PER_REQUEST || creditsInfo.planType === 'unlimited';
        const hasDailyLimit = creditsInfo.dailyRequestsRemaining > 0;

        res.status(200).send({
            canCreate: canCreate && hasDailyLimit,
            reason: !canCreate ? 'Insufficient credits' : !hasDailyLimit ? 'Daily limit reached' : null,
            creditsInfo,
            creditsRequired: CREDITS_PER_REQUEST
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;
