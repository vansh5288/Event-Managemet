export declare const generateCertificateId: () => string;
export declare const generateInvoiceNumber: () => string;
export declare const generateBarcode: () => string;
export declare const generateQRData: (registrationId: string, eventId: string) => string;
export declare const calculateCheckInRate: (checkedIn: number, total: number) => number;
export declare const sanitizeHtml: (str: string) => string;
export declare const slugify: (text: string) => string;
export declare const paginate: (page?: number, limit?: number) => {
    pageNum: number;
    limitNum: number;
    skip: number;
};
//# sourceMappingURL=helpers.d.ts.map