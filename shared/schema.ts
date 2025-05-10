import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  isVerified: boolean("is_verified").default(false),
  verificationStatus: jsonb("verification_status").$type<{
    phoneVerified: boolean;
    addressVerified: boolean;
  }>().default({
    phoneVerified: false,
    addressVerified: false
  }),
  createdAt: timestamp("created_at").defaultNow(),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
});

// Trip schema
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  departureAirport: text("departure_airport").notNull(),
  destinationCity: text("destination_city").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  arrivalDate: timestamp("arrival_date").notNull(),
  airline: text("airline"),
  flightNumber: text("flight_number"),
  availableWeight: real("available_weight").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// We'll remove this duplicate declaration as it conflicts with the one below

// Package schema
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  senderCity: text("sender_city").notNull(),
  receiverCity: text("receiver_city").notNull(),
  packageType: text("package_type").notNull(),
  weight: real("weight").notNull(),
  dimensions: jsonb("dimensions").$type<{
    length: number;
    width: number;
    height: number;
  }>(),
  deliveryDeadline: timestamp("delivery_deadline"),
  offeredPayment: real("offered_payment").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery schema (for matching travelers with packages)
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  packageId: integer("package_id").notNull().references(() => packages.id),
  travelerId: integer("traveler_id").notNull().references(() => users.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, accepted, in_transit, delivered, cancelled
  paymentStatus: text("payment_status").default("pending"), // pending, in_escrow, released, refunded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Review schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  revieweeId: integer("reviewee_id").notNull().references(() => users.id),
  deliveryId: integer("delivery_id").references(() => deliveries.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
  verificationStatus: true
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  userId: true,
  isActive: true,
  createdAt: true
}).extend({
  departureAirport: z.string()
    .min(3, "Airport code must be at least 3 characters")
    .refine((value) => /^([A-Z]{3}|\w+[\w\s-]*\s*(international|airport|intl).*)$/i.test(value), {
      message: "Please enter a valid airport code (e.g., JFK, LAX) or full airport name",
    }),
  departureDate: z.coerce.date().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Departure date must be today or in the future"),
  arrivalDate: z.coerce.date().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Arrival date must be today or in the future"),
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  userId: true,
  isActive: true,
  createdAt: true,
  status: true
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  paymentStatus: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;