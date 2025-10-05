// server.js or authRoutes.js
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import querystring from "querystring";
dotenv.config();

const router = express.Router();

// Step 1: Redirect user to Google's OAuth 2.0 server
router.get("/google", (req, res) => {
  const redirect_uri = encodeURIComponent("https://trackr-2fwo.onrender.com/auth/google/callback");
  const client_id = process.env.GOOGLE_CLIENT_ID;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${querystring.stringify({
    client_id,
    redirect_uri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  })}`;

  res.redirect(authUrl);
});

// Step 2: Google redirects back with `code`
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "https://your-backend.com/auth/google/callback",
      grant_type: "authorization_code",
    });

    const { id_token, access_token } = tokenRes.data;

    // You can now verify id_token (JWT) and/or fetch user info
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

        req.session.user = userInfo.data;

    // Here you can create a session or JWT for your app
    // Redirect back to app with some session token
    res.redirect(`trackr://login?`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Authentication failed");
  }
});

// Endpoint to check session
router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

export default router;
