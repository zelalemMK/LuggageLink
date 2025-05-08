import { 
  users, trips, packages, deliveries, messages, reviews,
  type User, type Trip, type Package, type Delivery, type Message, type Review,
  type InsertUser, type InsertTrip, type InsertPackage, type InsertDelivery, type InsertMessage, type InsertReview
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(userId: number, verificationData: Partial<User['verificationStatus']>): Promise<User>;
  
  // Trip operations
  getTrip(id: number): Promise<Trip | undefined>;
  getTrips(filters?: Partial<Trip>): Promise<Trip[]>;
  getTripsByUserId(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip, userId: number): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined>;
  
  // Package operations
  getPackage(id: number): Promise<Package | undefined>;
  getPackages(filters?: Partial<Package>): Promise<Package[]>;
  getPackagesByUserId(userId: number): Promise<Package[]>;
  createPackage(pkg: InsertPackage, userId: number): Promise<Package>;
  updatePackage(id: number, pkg: Partial<Package>): Promise<Package | undefined>;
  
  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveriesByTripId(tripId: number): Promise<Delivery[]>;
  getDeliveriesByPackageId(packageId: number): Promise<Delivery[]>;
  getDeliveriesByUserId(userId: number, role: 'traveler' | 'sender'): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string): Promise<Delivery | undefined>;
  updatePaymentStatus(id: number, status: string): Promise<Delivery | undefined>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByUserId(userId: number, role: 'reviewer' | 'reviewee'): Promise<Review[]>;
  getReviewsByDeliveryId(deliveryId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Session storage
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trips: Map<number, Trip>;
  private packages: Map<number, Package>;
  private deliveries: Map<number, Delivery>;
  private messages: Map<number, Message>;
  private reviews: Map<number, Review>;
  
  private userId: number;
  private tripId: number;
  private packageId: number;
  private deliveryId: number;
  private messageId: number;
  private reviewId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.packages = new Map();
    this.deliveries = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    
    this.userId = 1;
    this.tripId = 1;
    this.packageId = 1;
    this.deliveryId = 1;
    this.messageId = 1;
    this.reviewId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Since we're removing username field, we'll use email for authentication
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    
    const now = new Date();
    const id = this.userId++;
    
    const user: User = {
      ...userData,
      id,
      password: hashedPassword,
      isVerified: false,
      verificationStatus: {
        idVerified: false,
        phoneVerified: false,
        addressVerified: false,
      },
      createdAt: now,
      rating: 0,
      reviewCount: 0,
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserVerification(userId: number, verificationData: Partial<User['verificationStatus']>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedVerificationStatus = {
      ...user.verificationStatus,
      ...verificationData
    };

    // Check if all verifications are complete
    const isFullyVerified = Object.values(updatedVerificationStatus).every(status => status === true);

    const updatedUser: User = {
      ...user,
      verificationStatus: updatedVerificationStatus,
      isVerified: isFullyVerified
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Trip operations
  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTrips(filters?: Partial<Trip>): Promise<Trip[]> {
    let trips = Array.from(this.trips.values()).filter(trip => trip.isActive);
    
    if (filters) {
      if (filters.departureAirport) {
        trips = trips.filter(trip => trip.departureAirport.toLowerCase().includes(filters.departureAirport!.toLowerCase()));
      }
      if (filters.destinationCity) {
        trips = trips.filter(trip => trip.destinationCity.toLowerCase().includes(filters.destinationCity!.toLowerCase()));
      }
      if (filters.departureDate) {
        trips = trips.filter(trip => {
          const filterDate = new Date(filters.departureDate!);
          const tripDate = new Date(trip.departureDate);
          return tripDate >= filterDate;
        });
      }
      if (filters.availableWeight !== undefined) {
        trips = trips.filter(trip => trip.availableWeight >= filters.availableWeight!);
      }
    }
    
    return trips;
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.userId === userId);
  }

  async createTrip(tripData: InsertTrip, userId: number): Promise<Trip> {
    const id = this.tripId++;
    const now = new Date();
    
    const trip: Trip = {
      ...tripData,
      id,
      userId,
      isActive: true,
      createdAt: now,
    };
    
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: number, tripData: Partial<Trip>): Promise<Trip | undefined> {
    const trip = await this.getTrip(id);
    if (!trip) {
      return undefined;
    }
    
    const updatedTrip: Trip = {
      ...trip,
      ...tripData,
    };
    
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  // Package operations
  async getPackage(id: number): Promise<Package | undefined> {
    return this.packages.get(id);
  }

  async getPackages(filters?: Partial<Package>): Promise<Package[]> {
    let packages = Array.from(this.packages.values()).filter(pkg => pkg.isActive);
    
    if (filters) {
      if (filters.senderCity) {
        packages = packages.filter(pkg => pkg.senderCity.toLowerCase().includes(filters.senderCity!.toLowerCase()));
      }
      if (filters.receiverCity) {
        packages = packages.filter(pkg => pkg.receiverCity.toLowerCase().includes(filters.receiverCity!.toLowerCase()));
      }
      if (filters.packageType) {
        packages = packages.filter(pkg => pkg.packageType === filters.packageType);
      }
      if (filters.weight !== undefined) {
        packages = packages.filter(pkg => pkg.weight <= filters.weight!);
      }
      if (filters.deliveryDeadline) {
        packages = packages.filter(pkg => {
          if (!pkg.deliveryDeadline) return true;
          const filterDate = new Date(filters.deliveryDeadline!);
          const packageDate = new Date(pkg.deliveryDeadline);
          return packageDate >= filterDate;
        });
      }
    }
    
    return packages;
  }

  async getPackagesByUserId(userId: number): Promise<Package[]> {
    return Array.from(this.packages.values()).filter(pkg => pkg.userId === userId);
  }

  async createPackage(packageData: InsertPackage, userId: number): Promise<Package> {
    const id = this.packageId++;
    const now = new Date();
    
    const pkg: Package = {
      ...packageData,
      id,
      userId,
      status: "pending",
      isActive: true,
      createdAt: now,
    };
    
    this.packages.set(id, pkg);
    return pkg;
  }

  async updatePackage(id: number, packageData: Partial<Package>): Promise<Package | undefined> {
    const pkg = await this.getPackage(id);
    if (!pkg) {
      return undefined;
    }
    
    const updatedPackage: Package = {
      ...pkg,
      ...packageData,
    };
    
    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }

  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async getDeliveriesByTripId(tripId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(delivery => delivery.tripId === tripId);
  }

  async getDeliveriesByPackageId(packageId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values()).filter(delivery => delivery.packageId === packageId);
  }

  async getDeliveriesByUserId(userId: number, role: 'traveler' | 'sender'): Promise<Delivery[]> {
    if (role === 'traveler') {
      return Array.from(this.deliveries.values()).filter(delivery => delivery.travelerId === userId);
    } else {
      return Array.from(this.deliveries.values()).filter(delivery => delivery.senderId === userId);
    }
  }

  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    const id = this.deliveryId++;
    const now = new Date();
    
    const delivery: Delivery = {
      ...deliveryData,
      id,
      status: "pending",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };
    
    this.deliveries.set(id, delivery);
    
    // Update the package status to 'matched'
    const pkg = await this.getPackage(deliveryData.packageId);
    if (pkg) {
      await this.updatePackage(pkg.id, { status: "matched" });
    }
    
    return delivery;
  }

  async updateDeliveryStatus(id: number, status: string): Promise<Delivery | undefined> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      return undefined;
    }
    
    const now = new Date();
    const updatedDelivery: Delivery = {
      ...delivery,
      status,
      updatedAt: now,
    };
    
    this.deliveries.set(id, updatedDelivery);
    
    // If status is 'delivered', update the package status to 'delivered'
    if (status === 'delivered') {
      const pkg = await this.getPackage(delivery.packageId);
      if (pkg) {
        await this.updatePackage(pkg.id, { status: "delivered" });
      }
    }
    
    return updatedDelivery;
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<Delivery | undefined> {
    const delivery = await this.getDelivery(id);
    if (!delivery) {
      return undefined;
    }
    
    const now = new Date();
    const updatedDelivery: Delivery = {
      ...delivery,
      paymentStatus,
      updatedAt: now,
    };
    
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) || 
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.senderId === userId || message.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    
    const message: Message = {
      ...messageData,
      id,
      isRead: false,
      createdAt: now,
    };
    
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = await this.getMessage(id);
    if (!message) {
      return undefined;
    }
    
    const updatedMessage: Message = {
      ...message,
      isRead: true,
    };
    
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByUserId(userId: number, role: 'reviewer' | 'reviewee'): Promise<Review[]> {
    if (role === 'reviewer') {
      return Array.from(this.reviews.values()).filter(review => review.reviewerId === userId);
    } else {
      return Array.from(this.reviews.values()).filter(review => review.revieweeId === userId);
    }
  }

  async getReviewsByDeliveryId(deliveryId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.deliveryId === deliveryId);
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const now = new Date();
    
    const review: Review = {
      ...reviewData,
      id,
      createdAt: now,
    };
    
    this.reviews.set(id, review);
    
    // Update the user's rating
    const user = await this.getUser(reviewData.revieweeId);
    if (user) {
      const userReviews = await this.getReviewsByUserId(reviewData.revieweeId, 'reviewee');
      const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
      const newRating = totalRating / userReviews.length;
      
      const updatedUser: User = {
        ...user,
        rating: newRating,
        reviewCount: userReviews.length,
      };
      
      this.users.set(user.id, updatedUser);
    }
    
    return review;
  }
}

export const storage = new MemStorage();
