# trackr 
Collect. Connect. Explore.

trackr is a gamified wildlife recognition and logging app 
designed for anyone, anywhere.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Design
See our figma: https://www.figma.com/design/kVMjFmQlaH0wzLTeMCUUH4/Trackr---StormHacks-2025?node-id=0-1&p=f&t=oJKFFZNahVWzhSy4-0

## Get started
1. Clone this repository
   ```bash
   git clone https://github.com/arian-d1/trackr.git
2. Start the frontend
    ```bash
   npm install && npm start
   ```
3. Start backend
   ```cd backend && npm install && npm start
   ```
4. Install and use Expo Go
   ```Install Expo Go from your phones app store.
   
   Open your phones camera and scan the QR code to open the live development environment inside the Expo Go app.
   ```

5. Setup .env files 

### /backend:
```MONGODB_URI=mongodb://<LAN_IP>:27017/trackr
MONGODB_DB=trackr
JWT_SECRET=replace_with_a_long_random_secretrsr
SESSION_SECRET=replace_with_another_secret
```

### /:
```
EXPO_PUBLIC_API_BASE_URL=http://<LAN_IP>:3000
```

In the output, you'll find options to open  **trackr**  in a
- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo