import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "streamhive-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };

  // Trust the first proxy for secure cookies if in production
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie!.secure = true;
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Extended registration schema with password validation
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        isAdmin: false, // By default, new users are not admins
      });

      // Remove password from the response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user as User;
    return res.status(200).json(userWithoutPassword);
  });
}
