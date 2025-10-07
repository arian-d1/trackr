// Simple script to add sample data to the database
import mongoose from "mongoose";
import Captured from "./models/Captured.js";
import User from "./models/Users.js";

const ALLOWED_ANIMALS = [
  "Raccoon",
  "Squirrel", 
  "Bear",
  "Pigeon",
  "Crow",
  "Goose",
  "Dog"
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/trackr");
    console.log("Connected to MongoDB");

    // Create some test users
    const users = await User.create([
      {
        username: "testuser1",
        displayName: "Test User 1",
        settings: { privacy: { visibility: "public" } }
      },
      {
        username: "testuser2", 
        displayName: "Test User 2",
        settings: { privacy: { visibility: "public" } }
      },
      {
        username: "testuser3",
        displayName: "Test User 3", 
        settings: { privacy: { visibility: "public" } }
      }
    ]);

    console.log("Created test users:", users.length);

    // Create some test captures
    const captures = [];
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomAnimal = ALLOWED_ANIMALS[Math.floor(Math.random() * ALLOWED_ANIMALS.length)];
      const randomRating = Math.floor(Math.random() * 100) + 1;
      
      // Random location around Vancouver area
      const latitude = 49.2827 + (Math.random() - 0.5) * 0.1;
      const longitude = -122.9202 + (Math.random() - 0.5) * 0.1;

      captures.push({
        user_id: randomUser._id,
        animal: randomAnimal,
        photo: `sample_photo_${i}.jpg`, // Placeholder
        latitude,
        longitude,
        rating: randomRating,
        metadata: {
          platform: "iOS",
          deviceModel: "iPhone 13",
          accuracyMeters: 5
        },
        capturedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
      });
    }

    const createdCaptures = await Captured.create(captures);
    console.log("Created test captures:", createdCaptures.length);

    // Update user last locations
    for (const user of users) {
      const userCaptures = captures.filter(c => c.user_id.toString() === user._id.toString());
      if (userCaptures.length > 0) {
        const latestCapture = userCaptures[userCaptures.length - 1];
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              lastLocation: { 
                latitude: latestCapture.latitude, 
                longitude: latestCapture.longitude, 
                at: latestCapture.capturedAt 
              } 
            } 
          }
        );
      }
    }

    console.log("Updated user locations");

    console.log("✅ Sample data seeded successfully!");
    console.log(`- ${users.length} users created`);
    console.log(`- ${createdCaptures.length} captures created`);
    console.log("- User locations updated");

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export default seedData;

