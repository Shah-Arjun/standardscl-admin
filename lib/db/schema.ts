import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, text, timestamp, pgEnum, jsonb, numeric } from "drizzle-orm/pg-core";

// --- Enums ---
export const genderEnum = pgEnum("gender_enum", ["male", "female", "other"]);



// teachers schema
export const teachersTable = pgTable("teachers", {
  //takes table name and its columns names with validation as object
  id: serial("id").primaryKey(), //serial is a helper function that creates an auto-incrementing integer column, and id passed is actual name of db column, and primaryKey() marks it as the primary key of the table.
  teacherName: varchar("teacher_name", { length: 255 }).notNull(),
  gender: genderEnum("gender"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),

  employmentType: text("employment_type").notNull(),

  qualifications: jsonb("qualification").$type<string[]>(),

  subjectsTeaches: jsonb("subject_teaches").$type<string[]>(),
  post: jsonb("position").$type<string[]>(),

  experience: numeric("years_of_experience", { precision: 5, scale: 2 }).$type<number>(),
  photoPublicId: varchar("photo_public_id"), // Cloudinary public ID for the photo, to access photo
  photo: text("photo"), // URL of teacher's photo

  //   createdAt : timestamp("created_at").defaultNow(),    // or
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  //   updatedAt : timestamp("updated_at").defaultNow().onUpdateNow(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});





// user table
export const roleEnum = pgEnum("user_role", ["admin", "user"]);

export const userTable = pgTable("users", {
  email: varchar("email", { length: 255 }).primaryKey(),
  password: varchar("password", { length: 250 }).notNull(),

  role: roleEnum("role").notNull(),

  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),

  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()),
});





// notice schema
import { boolean, integer } from "drizzle-orm/pg-core";
import { url } from "inspector";

export const noticeCategoryEnum = pgEnum("notice_category", [
  "Admissions",
  "Sports",
  "Events",
  "Academic",
  "Meeting",
  "Holiday",
  "News",
  "Exam",
  "Result",
  "General",
]);

export const postedByEnum = pgEnum("posted_by", [
  "Principal",
  "Exam Coordinator",
  "Vice Principal",
]);


export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),

  category: noticeCategoryEnum("category").notNull(),

  postedBy: postedByEnum("posted_by").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});





//image by admin schema

export const categoryEnum = pgEnum("category", [
  "School",
  "Teachers",
  "Students",
  "Events",
  "Sports",
  "Arts",
  "Activities",
  "Educational Tour",
  "Memories"
]);

export const imageTable = pgTable("images", {
  id: serial("id").primaryKey(),
  category: categoryEnum("category").notNull(), // e.g., "teacher", "event", etc.
  title: varchar("title", { length: 255 }).notNull(),
  photoPublicId: varchar("photo_public_id").notNull(), // Cloudinary public ID for the photo, to access photo
  url: text("url").notNull(), //cloudinary URL of teacher's photo
  createdAt: timestamp("created_at").defaultNow().notNull()
})



// other schema goes here