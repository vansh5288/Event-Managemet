"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = exports.ExportService = void 0;
class ExportService {
    static toCSV(data, fields) {
        const headerFields = fields || Object.keys(data[0] || {});
        const header = headerFields.join(',');
        const rows = data.map((item) => headerFields
            .map((field) => {
            const value = item[field];
            if (value === null || value === undefined)
                return '';
            const str = String(value);
            // Escape CSV special characters
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        })
            .join(','));
        return [header, ...rows].join('\n');
    }
    static toExcelJSON(data) {
        return data.map((item) => {
            const flat = {};
            const flatten = (obj, prefix = '') => {
                Object.entries(obj).forEach(([key, value]) => {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                        flatten(value, newKey);
                    }
                    else {
                        flat[newKey] = value;
                    }
                });
            };
            flatten(item);
            return flat;
        });
    }
    static generateReportTitle(prefix) {
        const date = new Date().toISOString().split('T')[0];
        return `${prefix}_${date}`;
    }
}
exports.ExportService = ExportService;
exports.exportService = new ExportService();
//# sourceMappingURL=export.service.js.map