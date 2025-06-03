import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import {
  type IStorage,
} from './storage';
import {
  users,
  trips,
  packages,
  deliveries,
  messages,
  reviews,
  type User,
  type Trip,
  type Package,
  type Delivery,
  type Message,
  type Review,
  type InsertUser,
  type InsertTrip,
  type InsertPackage,
  type InsertDelivery,
  type InsertMessage,
  type InsertReview,
} from '@shared/schema';
import { pool, connectionString } from './db';
import { promisify } from 'util';
import { scrypt, randomBytes } from 'crypto';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}


function mapRowDates<T extends Record<string, any>>(row: T): T {
  // node-postgres returns dates as strings by default
  for (const key of Object.keys(row)) {
    if (row[key] instanceof Date || Object.prototype.toString.call(row[key]) === '[object Date]') {
      continue;
    }
    if (typeof row[key] === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(row[key])) {
      row[key] = new Date(row[key]);
    }
  }
  return row;
}

export class PgStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({ conString: connectionString });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.getUserByEmail(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const verification = { idVerified: false, phoneVerified: false, addressVerified: false };
    const { rows } = await pool.query(
      `INSERT INTO users (password, email, first_name, last_name, profile_image, is_verified, verification_status, created_at, rating, review_count)
       VALUES ($1,$2,$3,$4,$5,false,$6,NOW(),0,0) RETURNING *`,
      [hashedPassword, userData.email, userData.firstName, userData.lastName, userData.profileImage ?? null, verification]
    );
    return mapRowDates(rows[0]);
  }

  async updateUserVerification(userId: number, verificationData: Partial<User['verificationStatus']>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updated = { ...user.verificationStatus, ...verificationData };
    const isVerified = Object.values(updated).every((v) => v === true);

    const { rows } = await pool.query(
      'UPDATE users SET verification_status = $1, is_verified = $2 WHERE id = $3 RETURNING *',
      [updated, isVerified, userId]
    );
    return mapRowDates(rows[0]);
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    const { rows } = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getTrips(filters: Partial<Trip> = {}): Promise<Trip[]> {
    const clauses: string[] = ['is_active = true'];
    const params: any[] = [];
    if (filters.departureAirport) {
      params.push(`%${filters.departureAirport.toLowerCase()}%`);
      clauses.push(`LOWER(departure_airport) LIKE $${params.length}`);
    }
    if (filters.destinationCity) {
      params.push(`%${filters.destinationCity.toLowerCase()}%`);
      clauses.push(`LOWER(destination_city) LIKE $${params.length}`);
    }
    if (filters.departureDate) {
      params.push(filters.departureDate);
      clauses.push(`departure_date >= $${params.length}`);
    }
    if (filters.availableWeight !== undefined) {
      params.push(filters.availableWeight);
      clauses.push(`available_weight >= $${params.length}`);
    }

    const query = `SELECT * FROM trips WHERE ${clauses.join(' AND ')}`;
    const { rows } = await pool.query(query, params);
    return rows.map((r) => mapRowDates(r));
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    const { rows } = await pool.query('SELECT * FROM trips WHERE user_id = $1', [userId]);
    return rows.map((r) => mapRowDates(r));
  }

  async createTrip(tripData: InsertTrip, userId: number): Promise<Trip> {
    const { rows } = await pool.query(
      `INSERT INTO trips (user_id, departure_airport, destination_city, departure_date, arrival_date, airline, flight_number, available_weight, price_per_kg, notes, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NOW()) RETURNING *`,
      [
        userId,
        tripData.departureAirport,
        tripData.destinationCity,
        tripData.departureDate,
        tripData.arrivalDate,
        tripData.airline ?? null,
        tripData.flightNumber ?? null,
        tripData.availableWeight,
        tripData.pricePerKg,
        tripData.notes ?? null,
      ]
    );
    return mapRowDates(rows[0]);
  }

  async updateTrip(id: number, tripData: Partial<Trip>): Promise<Trip | undefined> {
    const fields: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(tripData)) {
      fields.push(`${key} = $${i}`);
      params.push(value);
      i++;
    }
    if (!fields.length) return this.getTrip(id);
    params.push(id);
    const query = `UPDATE trips SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await pool.query(query, params);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  // Package operations
  async getPackage(id: number): Promise<Package | undefined> {
    const { rows } = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getPackages(filters: Partial<Package> = {}): Promise<Package[]> {
    const clauses: string[] = ['is_active = true'];
    const params: any[] = [];
    if (filters.senderCity) {
      params.push(`%${filters.senderCity.toLowerCase()}%`);
      clauses.push(`LOWER(sender_city) LIKE $${params.length}`);
    }
    if (filters.receiverCity) {
      params.push(`%${filters.receiverCity.toLowerCase()}%`);
      clauses.push(`LOWER(receiver_city) LIKE $${params.length}`);
    }
    if (filters.packageType) {
      params.push(filters.packageType);
      clauses.push(`package_type = $${params.length}`);
    }
    if (filters.weight !== undefined) {
      params.push(filters.weight);
      clauses.push(`weight <= $${params.length}`);
    }
    if (filters.deliveryDeadline) {
      params.push(filters.deliveryDeadline);
      clauses.push(`delivery_deadline >= $${params.length}`);
    }
    const query = `SELECT * FROM packages WHERE ${clauses.join(' AND ')}`;
    const { rows } = await pool.query(query, params);
    return rows.map((r) => mapRowDates(r));
  }

  async getPackagesByUserId(userId: number): Promise<Package[]> {
    const { rows } = await pool.query('SELECT * FROM packages WHERE user_id = $1', [userId]);
    return rows.map((r) => mapRowDates(r));
  }

  async createPackage(packageData: InsertPackage, userId: number): Promise<Package> {
    const { rows } = await pool.query(
      `INSERT INTO packages (user_id, sender_city, receiver_city, package_type, weight, dimensions, delivery_deadline, offered_payment, description, status, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',true,NOW()) RETURNING *`,
      [
        userId,
        packageData.senderCity,
        packageData.receiverCity,
        packageData.packageType,
        packageData.weight,
        packageData.dimensions ?? null,
        packageData.deliveryDeadline ?? null,
        packageData.offeredPayment,
        packageData.description ?? null,
      ]
    );
    return mapRowDates(rows[0]);
  }

  async updatePackage(id: number, packageData: Partial<Package>): Promise<Package | undefined> {
    const fields: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(packageData)) {
      fields.push(`${key} = $${i}`);
      params.push(value);
      i++;
    }
    if (!fields.length) return this.getPackage(id);
    params.push(id);
    const query = `UPDATE packages SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await pool.query(query, params);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    const { rows } = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getDeliveriesByTripId(tripId: number): Promise<Delivery[]> {
    const { rows } = await pool.query('SELECT * FROM deliveries WHERE trip_id = $1', [tripId]);
    return rows.map((r) => mapRowDates(r));
  }

  async getDeliveriesByPackageId(packageId: number): Promise<Delivery[]> {
    const { rows } = await pool.query('SELECT * FROM deliveries WHERE package_id = $1', [packageId]);
    return rows.map((r) => mapRowDates(r));
  }

  async getDeliveriesByUserId(userId: number, role: 'traveler' | 'sender'): Promise<Delivery[]> {
    const column = role === 'traveler' ? 'traveler_id' : 'sender_id';
    const { rows } = await pool.query(`SELECT * FROM deliveries WHERE ${column} = $1`, [userId]);
    return rows.map((r) => mapRowDates(r));
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const { rows } = await pool.query(
      `INSERT INTO deliveries (trip_id, package_id, traveler_id, sender_id, status, payment_status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'pending','pending',NOW(),NOW()) RETURNING *`,
      [
        deliveryData.tripId,
        deliveryData.packageId,
        deliveryData.travelerId,
        deliveryData.senderId,
      ]
    );
    // update package status to matched
    await pool.query('UPDATE packages SET status = $1 WHERE id = $2', ['matched', deliveryData.packageId]);
    return mapRowDates(rows[0]);
  }

  async updateDeliveryStatus(id: number, status: string): Promise<Delivery | undefined> {
    const { rows } = await pool.query(
      'UPDATE deliveries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (status === 'delivered') {
      const delivery = rows[0];
      if (delivery) {
        await pool.query('UPDATE packages SET status = $1 WHERE id = $2', ['delivered', delivery.package_id]);
      }
    }
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<Delivery | undefined> {
    const { rows } = await pool.query(
      'UPDATE deliveries SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [paymentStatus, id]
    );
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const { rows } = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    const { rows } = await pool.query(
      `SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at`,
      [userId1, userId2]
    );
    return rows.map((r) => mapRowDates(r));
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    const { rows } = await pool.query(
      `SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((r) => mapRowDates(r));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES ($1,$2,$3,false,NOW()) RETURNING *`,
      [messageData.senderId, messageData.receiverId, messageData.content]
    );
    return mapRowDates(rows[0]);
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const { rows } = await pool.query('UPDATE messages SET is_read = true WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    return rows[0] ? mapRowDates(rows[0]) : undefined;
  }

  async getReviewsByUserId(userId: number, role: 'reviewer' | 'reviewee'): Promise<Review[]> {
    const column = role === 'reviewer' ? 'reviewer_id' : 'reviewee_id';
    const { rows } = await pool.query(`SELECT * FROM reviews WHERE ${column} = $1`, [userId]);
    return rows.map((r) => mapRowDates(r));
  }

  async getReviewsByDeliveryId(deliveryId: number): Promise<Review[]> {
    const { rows } = await pool.query('SELECT * FROM reviews WHERE delivery_id = $1', [deliveryId]);
    return rows.map((r) => mapRowDates(r));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const { rows } = await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewee_id, delivery_id, rating, comment, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [
        reviewData.reviewerId,
        reviewData.revieweeId,
        reviewData.deliveryId ?? null,
        reviewData.rating,
        reviewData.comment ?? null,
      ]
    );

    const userReviews = await this.getReviewsByUserId(reviewData.revieweeId, 'reviewee');
    const total = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = total / userReviews.length;
    await pool.query('UPDATE users SET rating = $1, review_count = $2 WHERE id = $3', [newRating, userReviews.length, reviewData.revieweeId]);

    return mapRowDates(rows[0]);
  }
}
