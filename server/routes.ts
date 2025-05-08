import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { insertTripSchema, insertPackageSchema, insertDeliverySchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  const httpServer = createServer(app);
  
  // Set up WebSocket for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket is already imported at the top of the file
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      // Broadcast messages to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.departureCity) filters.departureCity = req.query.departureCity as string;
      if (req.query.destinationCity) filters.destinationCity = req.query.destinationCity as string;
      if (req.query.departureDate) filters.departureDate = req.query.departureDate as string;
      if (req.query.availableWeight) filters.availableWeight = parseFloat(req.query.availableWeight as string);
      
      const trips = await storage.getTrips(filters);
      
      // For each trip, fetch the user to include verification status and rating
      const tripsWithUserDetails = await Promise.all(trips.map(async (trip) => {
        const user = await storage.getUser(trip.userId);
        return {
          ...trip,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            verificationStatus: user.verificationStatus,
            rating: user.rating,
            reviewCount: user.reviewCount,
            createdAt: user.createdAt
          } : null
        };
      }));
      
      res.json(tripsWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });
  
  app.get("/api/trips/user/:userId?", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      let userId = req.user!.id;
      
      // If a userId is provided and it's not the current user's ID,
      // verify the user exists
      if (req.params.userId) {
        userId = parseInt(req.params.userId);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const trips = await storage.getTripsByUserId(userId);
      
      // Return the trips array even if it's empty
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trips" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const user = await storage.getUser(trip.userId);
      
      res.json({
        ...trip,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          verificationStatus: user.verificationStatus,
          rating: user.rating,
          reviewCount: user.reviewCount,
          createdAt: user.createdAt
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData, req.user!.id);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      if (trip.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this trip" });
      }
      
      const updatedTrip = await storage.updateTrip(tripId, req.body);
      res.json(updatedTrip);
    } catch (error) {
      res.status(500).json({ message: "Failed to update trip" });
    }
  });

  // Package routes
  app.get("/api/packages", async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.senderCity) filters.senderCity = req.query.senderCity as string;
      if (req.query.receiverCity) filters.receiverCity = req.query.receiverCity as string;
      if (req.query.packageType) filters.packageType = req.query.packageType as string;
      if (req.query.weight) filters.weight = parseFloat(req.query.weight as string);
      if (req.query.deliveryDeadline) filters.deliveryDeadline = req.query.deliveryDeadline as string;
      
      const packages = await storage.getPackages(filters);
      
      // For each package, fetch the user to include verification status and rating
      const packagesWithUserDetails = await Promise.all(packages.map(async (pkg) => {
        const user = await storage.getUser(pkg.userId);
        return {
          ...pkg,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            verificationStatus: user.verificationStatus,
            rating: user.rating,
            reviewCount: user.reviewCount,
            createdAt: user.createdAt
          } : null
        };
      }));
      
      res.json(packagesWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });
  
  app.get("/api/packages/user/:userId?", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      let userId = req.user!.id;
      
      // If a userId is provided and it's not the current user's ID,
      // verify the user exists
      if (req.params.userId) {
        userId = parseInt(req.params.userId);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      const packages = await storage.getPackagesByUserId(userId);
      
      // Return the packages array even if it's empty
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.get("/api/packages/:id", async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const user = await storage.getUser(pkg.userId);
      
      res.json({
        ...pkg,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          verificationStatus: user.verificationStatus,
          rating: user.rating,
          reviewCount: user.reviewCount,
          createdAt: user.createdAt
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  app.post("/api/packages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const packageData = insertPackageSchema.parse(req.body);
      const pkg = await storage.createPackage(packageData, req.user!.id);
      res.status(201).json(pkg);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  app.put("/api/packages/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const packageId = parseInt(req.params.id);
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (pkg.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this package" });
      }
      
      const updatedPackage = await storage.updatePackage(packageId, req.body);
      res.json(updatedPackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  // Delivery routes
  app.get("/api/deliveries/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const travelerDeliveries = await storage.getDeliveriesByUserId(req.user!.id, 'traveler');
      const senderDeliveries = await storage.getDeliveriesByUserId(req.user!.id, 'sender');
      
      // Combine and enrich with trip and package details
      const enrichedDeliveries = await Promise.all([...travelerDeliveries, ...senderDeliveries].map(async (delivery) => {
        const trip = await storage.getTrip(delivery.tripId);
        const pkg = await storage.getPackage(delivery.packageId);
        const sender = await storage.getUser(delivery.senderId);
        const traveler = await storage.getUser(delivery.travelerId);
        
        return {
          ...delivery,
          trip,
          package: pkg,
          sender: sender ? {
            id: sender.id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            profileImage: sender.profileImage,
            verificationStatus: sender.verificationStatus,
            rating: sender.rating,
            reviewCount: sender.reviewCount
          } : null,
          traveler: traveler ? {
            id: traveler.id,
            firstName: traveler.firstName,
            lastName: traveler.lastName,
            profileImage: traveler.profileImage,
            verificationStatus: traveler.verificationStatus,
            rating: traveler.rating,
            reviewCount: traveler.reviewCount
          } : null
        };
      }));
      
      res.json(enrichedDeliveries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/:id", async (req, res) => {
    try {
      const deliveryId = parseInt(req.params.id);
      const delivery = await storage.getDelivery(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      const trip = await storage.getTrip(delivery.tripId);
      const pkg = await storage.getPackage(delivery.packageId);
      const sender = await storage.getUser(delivery.senderId);
      const traveler = await storage.getUser(delivery.travelerId);
      
      res.json({
        ...delivery,
        trip,
        package: pkg,
        sender: sender ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profileImage: sender.profileImage,
          verificationStatus: sender.verificationStatus,
          rating: sender.rating,
          reviewCount: sender.reviewCount
        } : null,
        traveler: traveler ? {
          id: traveler.id,
          firstName: traveler.firstName,
          lastName: traveler.lastName,
          profileImage: traveler.profileImage,
          verificationStatus: traveler.verificationStatus,
          rating: traveler.rating,
          reviewCount: traveler.reviewCount
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch delivery" });
    }
  });

  app.post("/api/deliveries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      
      // Verify the package and trip exist
      const pkg = await storage.getPackage(deliveryData.packageId);
      const trip = await storage.getTrip(deliveryData.tripId);
      
      if (!pkg || !trip) {
        return res.status(404).json({ message: "Package or trip not found" });
      }
      
      // Create the delivery connection
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.put("/api/deliveries/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deliveryId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const delivery = await storage.getDelivery(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      // Check if the user is the sender or traveler
      if (delivery.senderId !== req.user!.id && delivery.travelerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this delivery" });
      }
      
      const updatedDelivery = await storage.updateDeliveryStatus(deliveryId, status);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });

  app.put("/api/deliveries/:id/payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const deliveryId = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      
      if (!paymentStatus) {
        return res.status(400).json({ message: "Payment status is required" });
      }
      
      const delivery = await storage.getDelivery(deliveryId);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      // Only the sender can update payment status
      if (delivery.senderId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update payment status" });
      }
      
      const updatedDelivery = await storage.updatePaymentStatus(deliveryId, paymentStatus);
      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const messages = await storage.getMessagesByUserId(req.user!.id);
      
      // Group messages by the other user
      const conversations: Record<number, any> = {};
      
      for (const message of messages) {
        const otherUserId = message.senderId === req.user!.id ? message.receiverId : message.senderId;
        
        if (!conversations[otherUserId]) {
          const otherUser = await storage.getUser(otherUserId);
          
          if (!otherUser) continue;
          
          conversations[otherUserId] = {
            user: {
              id: otherUser.id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              profileImage: otherUser.profileImage
            },
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              receiverId: message.receiverId,
              isRead: message.isRead,
              createdAt: message.createdAt
            },
            unreadCount: message.receiverId === req.user!.id && !message.isRead ? 1 : 0
          };
        } else {
          // Check if this message is more recent
          if (message.createdAt > conversations[otherUserId].lastMessage.createdAt) {
            conversations[otherUserId].lastMessage = {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              receiverId: message.receiverId,
              isRead: message.isRead,
              createdAt: message.createdAt
            };
          }
          
          // Count unread messages
          if (message.receiverId === req.user!.id && !message.isRead) {
            conversations[otherUserId].unreadCount++;
          }
        }
      }
      
      res.json(Object.values(conversations));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getMessagesBetweenUsers(req.user!.id, otherUserId);
      
      // Mark messages as read if the current user is the receiver
      await Promise.all(messages.map(async (message) => {
        if (message.receiverId === req.user!.id && !message.isRead) {
          await storage.markMessageAsRead(message.id);
        }
      }));
      
      const otherUser = await storage.getUser(otherUserId);
      
      if (!otherUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        messages,
        user: {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          profileImage: otherUser.profileImage
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id
      });
      
      const receiverUser = await storage.getUser(messageData.receiverId);
      
      if (!receiverUser) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Review routes
  app.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getReviewsByUserId(userId, 'reviewee');
      
      // Enrich reviews with reviewer info
      const enrichedReviews = await Promise.all(reviews.map(async (review) => {
        const reviewer = await storage.getUser(review.reviewerId);
        
        return {
          ...review,
          reviewer: reviewer ? {
            id: reviewer.id,
            firstName: reviewer.firstName,
            lastName: reviewer.lastName,
            profileImage: reviewer.profileImage
          } : null
        };
      }));
      
      res.json(enrichedReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user!.id
      });
      
      // Check if delivery exists and the user is part of it
      if (reviewData.deliveryId) {
        const delivery = await storage.getDelivery(reviewData.deliveryId);
        
        if (!delivery) {
          return res.status(404).json({ message: "Delivery not found" });
        }
        
        // Ensure the user is either the sender or traveler
        if (delivery.senderId !== req.user!.id && delivery.travelerId !== req.user!.id) {
          return res.status(403).json({ message: "Not authorized to review this delivery" });
        }
        
        // Ensure the reviewee is the other party in the delivery
        if (reviewData.revieweeId !== delivery.senderId && reviewData.revieweeId !== delivery.travelerId) {
          return res.status(400).json({ message: "Reviewee must be part of the delivery" });
        }
      }
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // User verification route
  app.post("/api/verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { verificationType } = req.body;
      
      if (!verificationType || !['idVerified', 'phoneVerified', 'addressVerified'].includes(verificationType)) {
        return res.status(400).json({ message: "Invalid verification type" });
      }
      
      // In a real app, we would perform actual verification here
      // For this MVP, we'll just mark it as verified
      const verificationData = {
        [verificationType]: true
      };
      
      const updatedUser = await storage.updateUserVerification(req.user!.id, verificationData);
      
      res.json({
        verificationStatus: updatedUser.verificationStatus,
        isVerified: updatedUser.isVerified
      });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  return httpServer;
}
