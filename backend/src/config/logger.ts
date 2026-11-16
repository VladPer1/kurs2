import { Logtail } from '@logtail/node';

const logtailToken = process.env.LOGTAIL_TOKEN;
const logtailEndpoint = process.env.LOGTAIL_ENDPOINT;
let logtail: Logtail | null = null;

if (logtailToken && logtailEndpoint) {
  logtail = new Logtail(logtailToken, { endpoint: logtailEndpoint });
}


export interface AuditLogEntry {
  timestamp: string;
  event_type: 'AUTH_FAILED' | 'ACCOUNT_LOCKED' | 'ACCESS_DENIED' | 'AUTH_SUCCESS' | 'PASSWORD_BRUTE_FORCE_ATTEMPT';
  email?: string;
  ip: string;
  endpoint: string;
  details: string;
}

const auditMemoryLogs: AuditLogEntry[] = [];
const MAX_LOGS = 200;

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    if (logtail) {
      logtail.info(message, meta);
    }
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    if (logtail) {
      logtail.warn(message, meta);
    }
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    if (logtail) {
      logtail.error(message, meta);
    }
  },
  audit: (entry: {
    event_type?: any;
    eventType?: any;
    email?: string;
    ip: string;
    endpoint: string;
    details: string;
  }) => {
    const fullEntry: AuditLogEntry = {
      event_type: entry.event_type || entry.eventType,
      email: entry.email,
      ip: entry.ip,
      endpoint: entry.endpoint,
      details: entry.details,
      timestamp: new Date().toISOString(),
    };
    auditMemoryLogs.unshift(fullEntry);
    if (auditMemoryLogs.length > MAX_LOGS) {
      auditMemoryLogs.pop();
    }
    console.warn(`[AUDIT_SECURITY] [${fullEntry.event_type}] IP: ${fullEntry.ip} - User: ${fullEntry.email || 'anonymous'} - Path: ${fullEntry.endpoint} - ${fullEntry.details}`);
    if (logtail) {
      logtail.warn(`[AUDIT_SECURITY] [${fullEntry.event_type}] IP: ${fullEntry.ip} - User: ${fullEntry.email || 'anonymous'} - Path: ${fullEntry.endpoint} - ${fullEntry.details}`, fullEntry);
    }
  },
  getAuditLogs: () => [...auditMemoryLogs],
};

