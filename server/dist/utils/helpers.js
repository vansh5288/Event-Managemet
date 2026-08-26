"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.slugify = exports.sanitizeHtml = exports.calculateCheckInRate = exports.generateQRData = exports.generateBarcode = exports.generateInvoiceNumber = exports.generateCertificateId = void 0;
const uuid_1 = require("uuid");
const generateCertificateId = () => {
    return `CERT-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
};
exports.generateCertificateId = generateCertificateId;
const generateInvoiceNumber = () => {
    return `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
const generateBarcode = () => {
    return `BC-${(0, uuid_1.v4)().slice(0, 12).toUpperCase()}`;
};
exports.generateBarcode = generateBarcode;
const generateQRData = (registrationId, eventId) => {
    return JSON.stringify({
        reg: registrationId,
        event: eventId,
        ts: Date.now(),
    });
};
exports.generateQRData = generateQRData;
const calculateCheckInRate = (checkedIn, total) => {
    if (total === 0)
        return 0;
    return Math.round((checkedIn / total) * 100);
};
exports.calculateCheckInRate = calculateCheckInRate;
const sanitizeHtml = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;');
};
exports.sanitizeHtml = sanitizeHtml;
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};
exports.slugify = slugify;
const paginate = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(Math.max(1, limit), 100);
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
};
exports.paginate = paginate;
//# sourceMappingURL=helpers.js.map