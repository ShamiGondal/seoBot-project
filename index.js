const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { generateTraffic, findWebsiteByKeyword } = require('./bot');
const userRoutes = require('./routes/userRoutes');
const { authenticate } = require('./middleware/authMiddleware');
const { addTaskToQueue, processQueue } = require('./queue');
const { storeTrafficData, updateTrafficDataRank, updateTrafficDataHits } = require('./helpers/dbHelpers');
const User = require('./models/user');
const TrafficData = require('./models/trafficData');

const app = express();
const port = process.env.PORT || 5000;

const mongoURI = 'mongodb+srv://infinitywavesinc:infinitywaveinc@cluster0.1gtz1nv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);

const subscriptions = {
    free: { hitsPerDay: 10, durationDays: Infinity },
    plan1: { hitsPerDay: 3000, durationDays: 7 },
    plan2: { hitsPerDay: 500, durationDays: 30 }
};

const getPlanDetails = (planType) => subscriptions[planType];

const getTotalSecondsInDay = () => 24 * 60 * 60;

const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const addTasksToQueue = async (url, keyword, country, userId, hitsPerDay, durationDays, waitTimeSeconds) => {
    for (let day = 0; day < durationDays; day++) {
        for (let hit = 0; hit < hitsPerDay; hit++) {
            addTaskToQueue(generateTraffic({ url, keyword, stayTime: 3000, numBots: 1, country, userId }));
            await wait(waitTimeSeconds);
        }
    }
};

const handleTrafficGeneration = (url, keyword, country, userId, hitsPerDay, durationDays) => {
    User.findByIdAndUpdate(userId, { website: url, keyword, country, rank: null }).then(() => {
        //storeTrafficData({ userId, keyword, website: url, country });

        const waitTimeSeconds = Math.floor(getTotalSecondsInDay() / hitsPerDay);

        addTasksToQueue(url, keyword, country, userId, hitsPerDay, durationDays, waitTimeSeconds).catch(console.error);
    }).catch(console.error);
};

app.post('/api/users/generate-traffic-by-subscription', authenticate, async (req, res) => {
    const { keyword, url, country } = req.body;
    const userId = req.user.id;

    if (!keyword || !url || !country) {
        return res.status(400).send('Missing required parameters');
    }

    try {
        const user = await User.findById(userId);
        if (!user || !user.subscription) {
            return res.status(403).send('No active subscription found for user');
        }

        const planDetails = getPlanDetails(user.subscription);
        if (!planDetails) {
            return res.status(400).send('Invalid subscription plan');
        }

        const { hitsPerDay, durationDays } = planDetails;
        storeTrafficData({ userId, keyword, website: url, country });
        const isWebsiteFound = await findWebsiteByKeyword({ url, keyword, userId, country });
        if (!isWebsiteFound) {
           // storeTrafficData({ userId, keyword, website: url, country });
            handleTrafficGeneration(url, keyword, country, userId, hitsPerDay, durationDays);
            return res.status(201).send({ message: 'Your website was not found in the top 100 search results for the given keyword' });
        }

        handleTrafficGeneration(url, keyword, country, userId, hitsPerDay, durationDays);
        res.status(200).send({ message: 'Traffic generation tasks are being added to the queue' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    processQueue();
});
