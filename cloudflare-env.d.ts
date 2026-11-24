declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PHOTO_STORE?: KVNamespace;
    AUTH_MODE?: string;
    ADMIN_USER?: string;
    ADMIN_PASSWORD?: string;
    OWNER_EMAIL?: string;
    NOTIFICATION_EMAIL?: string;
    NOTIFICATION_FROM_EMAIL?: string;
    RESEND_API_KEY?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
  }
}
