export declare const generateAccessToken: (userId: string, role: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const generateOTP: () => string;
export declare const verifyToken: (token: string) => {
    userId: string;
    role?: string;
};
//# sourceMappingURL=tokens.d.ts.map