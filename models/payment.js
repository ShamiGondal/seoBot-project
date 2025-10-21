const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Plan details
    planType: { 
        type: String, 
        enum: ['basic', 'premium', 'unlimited'], 
        required: true 
    },
    creditsPurchased: { type: Number, required: true },
    pricePaid: { type: Number, required: true }, // Amount in rupees
    
    // Payment processing
    paymentId: { type: String, unique: true, sparse: true }, // External payment ID
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'], 
        default: 'pending' 
    },
    paymentMethod: { type: String, default: 'online' },
    
    // Transaction details
    transactionId: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    
    // Timestamps
    paymentDate: { type: Date, default: Date.now },
    expiryDate: { type: Date }
}, {
    timestamps: true
});

// Indexes for better performance
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
