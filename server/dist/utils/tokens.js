"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateOTP = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, config_1.config.jwtSecret, {
        expiresIn: '7d',
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, config_1.config.jwtSecret, {
        expiresIn: '30d',
    });
};
exports.generateRefreshToken = generateRefreshToken;
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=tokens.js.map