import {sqliteTable,text,index} from "drizzle-orm/sqlite-core";
export const leads=sqliteTable("leads",{
 id:text("id").primaryKey(), createdAt:text("created_at").notNull(),
 name:text("name").notNull(),phone:text("phone").notNull(),car:text("car").notNull(),
 service:text("service").notNull(),preferredDate:text("preferred_date").notNull(),
 description:text("description").notNull(),photos:text("photos").notNull(),
 consentVersion:text("consent_version").notNull(),fingerprint:text("fingerprint").notNull(),
 emailStatus:text("email_status").notNull(),telegramStatus:text("telegram_status").notNull(),
},table=>[index("leads_created").on(table.createdAt),index("leads_fingerprint").on(table.fingerprint,table.createdAt)]);
