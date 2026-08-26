import { v4 as uuidv4 } from 'uuid';

export const generateCertificateId = (): string => {
  return `CERT-${uuidv4().slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
};

export const generateInvoiceNumber = (): string => {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

export const generateBarcode = (): string => {
  return `BC-${uuidv4().slice(0, 12).toUpperCase()}`;
};

export const generateQRData = (registrationId: string, eventId: string): string => {
  return JSON.stringify({
    reg: registrationId,
    event: eventId,
    ts: Date.now(),
  });
};

export const calculateCheckInRate = (checkedIn: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((checkedIn / total) * 100);
};

export const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;');
};

export const slugify = (text: string): string => {
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

export const paginate = (page: number = 1, limit: number = 10) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(Math.max(1, limit), 100);
  const skip = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, skip };
};
