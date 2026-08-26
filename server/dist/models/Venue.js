"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Venue = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const venueSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, 'Venue name is required'], trim: true },
    description: { type: String, maxlength: 1000 },
    address: { type: String, required: [true, 'Address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String },
    country: { type: String, required: [true, 'Country is required'] },
    zipCode: { type: String },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
    capacity: { type: Number, required: [true, 'Capacity is required'] },
    amenities: [{ type: String }],
    images: [{ type: String }],
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
venueSchema.index({ city: 1, country: 1 });
venueSchema.index({ isActive: 1 });
exports.Venue = mongoose_1.default.model('Venue', venueSchema);
//# sourceMappingURL=Venue.js.map