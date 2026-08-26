import mongoose, { Document } from 'mongoose';
export declare enum CertificateStatus {
    VALID = "valid",
    REVOKED = "revoked"
}
export interface ICertificate extends Document {
    event: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    registration: mongoose.Types.ObjectId;
    certificateId: string;
    title: string;
    description?: string;
    status: CertificateStatus;
    issuedAt: Date;
    verifiedAt?: Date;
    blockchainTxHash?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Certificate: mongoose.Model<ICertificate, {}, {}, {}, mongoose.Document<unknown, {}, ICertificate> & ICertificate & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Certificate.d.ts.map