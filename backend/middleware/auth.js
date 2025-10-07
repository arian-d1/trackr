import jwt from "jsonwebtoken";
import User from "../models/Users.js";

// Enhanced JWT verification with session validation
export function verifyJWT(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const { userId, sessionId } = payload;
    
    if (!userId || !sessionId) {
      return res.status(401).json({ error: "invalid token payload" });
    }
    
    // Verify session exists in user's sessions array
    User.findById(userId)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: "user not found" });
        }
        
        if (!user.sessions.includes(sessionId)) {
          return res.status(401).json({ error: "session invalid or expired" });
        }
        
        req.auth = payload;
        req.user = user; // Also set req.user for compatibility
        next();
      })
      .catch(err => {
        console.error("Session validation error:", err);
        res.status(500).json({ error: "session validation failed" });
      });
      
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "invalid token" });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "token expired" });
    }
    console.error("JWT verification error:", err);
    res.status(500).json({ error: "token verification failed" });
  }
}
