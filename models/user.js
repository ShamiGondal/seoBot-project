const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscription: { type: String, enum: ['free', 'basic', 'premium', 'unlimited'], default: 'free' },
    
    // Credits and billing
    credits: { type: Number, default: 50 }, // 50 free credits for new users
    totalCreditsUsed: { type: Number, default: 0 },
    
    // Payment and plan details
    planType: { type: String, enum: ['free', 'basic', 'premium', 'unlimited'], default: 'free' },
    planPrice: { type: Number, default: 0 },
    planCredits: { type: Number, default: 50 }, // Credits included in current plan
    
    // Account limits
    dailyRequestLimit: { type: Number, default: 5 },
    dailyRequestsUsed: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    
    // Payment info
    isPaymentActive: { type: Boolean, default: false },
    paymentExpiryDate: { type: Date, default: null }
});

// Hash the password before saving the user
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
