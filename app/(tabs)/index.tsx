import { IconSymbol } from "@/components/ui/icon-symbol";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PhotoPreview from "@/components/PhotoPreview";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import api from "../util/axios";

const SCREEN_HEIGHT = Dimensions.get("window").height;
// Collection data will be fetched from API

// Animal image dictionary
const animal_image_dict: { [key: string]: any } = {
  Raccoon: require("../../assets/images/raccoon.png"),
  Squirrel: require("../../assets/images/squirrel.png"),
  Bear: require("../../assets/images/bear.png"),
  Pigeon: require("../../assets/images/pigeon.png"),
  Crow: require("../../assets/images/crow.png"),
  Goose: require("../../assets/images/goose.png"),
};

// Read file as Base64
async function getImageAsBase64(uri: string) {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Failed to read image:", error);
    return null;
  }
}

export default function CameraScreen() {
  
  const [cameraPermission, reqCameraPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  const [locationPermission, setLocationPermission] =
    useState<Location.PermissionStatus | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const [facing, setFacing] = useState<CameraType>("back");

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const SHEET_PEEK_HEIGHT = 0; // how much shows when collapsed
  const SHEET_PARTIAL_OPEN = insets.top; // small gap below notch

  const sheetTranslation = useSharedValue(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);

  const router = useRouter();

  const [animalModalData, setAnimalModalData] = useState<{ name: string }[]>(
    [],
  );
  const { user } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  
  // Collection data state
  const [collectionData, setCollectionData] = useState<{
    items: Array<{
      id: string;
      user_id: string;
      power: number;
      animal_type: string;
      image_uri?: string;
      emoji?: string;
    }>;
    total: number;
  }>({
    items: [],
    total: 0,
  });
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [captures, setCaptures] = useState<any[]>([]);
  

  const zoom = useSharedValue(0);
  const baseZoom = useSharedValue(0);
  const [zoomLevel, setZoomLevel] = useState(0);


  // Fetch collection data
  const loadCollectionData = async () => {
    if (!user) return;
    
    try {
      setCollectionLoading(true);
      const response = await api.get(`/api/captures/${user.username}`);
      const capturesData = response.data;
      
      // Store the captures data for navigation
      setCaptures(capturesData);
      
      // Group captures by animal type and get the highest rating for each
      const animalGroups: { [key: string]: { maxRating: number; count: number } } = {};
      
      capturesData.forEach((capture: any) => {
        const animalType = capture.animal;
        if (!animalGroups[animalType]) {
          animalGroups[animalType] = { maxRating: 0, count: 0 };
        }
        animalGroups[animalType].maxRating = Math.max(animalGroups[animalType].maxRating, capture.rating || 0);
        animalGroups[animalType].count += 1;
      });
      
      // Convert to collection items format
      const items = Object.entries(animalGroups).map(([animalType, data], index) => ({
        id: `${index}`,
        user_id: user._id,
        power: data.maxRating,
        animal_type: animalType,
      }));
      
      setCollectionData({
        items,
        total: items.length,
      });
    } catch (error) {
      console.error("Error loading collection data:", error);
    } finally {
      setCollectionLoading(false);
    }
  };

  // Request permissions to camera and location.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === "granted") {
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
      } else {
        console.log("Location permission denied");
      }
    })();
  }, []);

  // Load collection data when user changes
  useEffect(() => {
    if (user) {
      loadCollectionData();
    }
  }, [user]);


  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslation.value }],
    borderTopLeftRadius: interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [20, 20], // keep rounded at all times
      Extrapolate.CLAMP,
    ),
    borderTopRightRadius: interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [20, 20],
      Extrapolate.CLAMP,
    ),
  }));


  // ? animate the photo button
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sheetTranslation.value,
      [0, SCREEN_HEIGHT - SHEET_PEEK_HEIGHT],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  });

  // NEED PERMISSION
  if (!cameraPermission) {
    return <Text>Loading permissions...</Text>;
  }
  if (!cameraPermission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <TouchableOpacity onPress={reqCameraPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // NEED PERMISSION

  // Flip the camera (switch camera in use)
  const toggleCameraType = () => {
    setFacing((facing) => (facing === "back" ? "front" : "back"));
  };

  // Capture a photo and save to photoUri
  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        // Try to get location if permission is granted, but don't block photo capture
        if (locationPermission === "granted") {
          try {
            const current = await Location.getCurrentPositionAsync({});
            setLocation(current);
          } catch (locationError) {
            console.log("Could not get location:", locationError);
          }
        }
        
        setPhotoUri(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Camera Error", "Could not capture photo. Please try again.");
      }
    }
  };

  const toggleSheet = () => {
    // If currently collapsed, animate to partially open
    if (sheetTranslation.value > SHEET_PARTIAL_OPEN) {
      sheetTranslation.value = withSpring(SHEET_PARTIAL_OPEN, {
        damping: 100, // higher damping, less bounce
        stiffness: 100,
      }); // optional, makes snap firmer });
    } else {
      // Collapse to peek height
      sheetTranslation.value = withSpring(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT, {
        damping: 100,
        stiffness: 100,
      });
    }
  };


  // Navigation swipe gestures are now handled by useSwipeNavigation hook

  const pinchGesture = Gesture.Pinch()
  .onStart(() => {
    baseZoom.value = zoom.value;
  })
  .onUpdate((event) => {
    const nextZoom = Math.min(
      Math.max(baseZoom.value + (event.scale - 1) * 0.5, 0),
      1
    );
    zoom.value = nextZoom;
    runOnJS(setZoomLevel)(zoom.value);
  })
  .onEnd(() => {
  });

  // Return (display) the photo that the user has taken.
  if (photoUri) {
    return (
      <PhotoPreview
        uri={photoUri}
        onCancel={() => {
          setPhotoUri(null);
          console.log("Declined photo");
        }}
        onContinue={async () => {
          console.log("Accepted photo:", JSON.stringify(photoUri));
          console.log("Location:", location);
          try {
            const base64Image = await getImageAsBase64(photoUri);
            
            // Process image and save to database in one call
            const response = await api.post("/api/process", {
              base64: base64Image,
              mimeType: "image/jpeg",
              latitude: location?.coords.latitude,
              longitude: location?.coords.longitude,
              metadata: { 
                platform: Platform.OS,
                deviceModel: "Unknown", // Could be enhanced with device info
                accuracyMeters: location?.coords.accuracy || 0
              }
            });

            if (response.data.animals && response.data.animals.length > 0) {
              setAnimalModalData(response.data.animals);
              setCurrentCardIndex(0);
              setShowAnimalModal(true);
              console.log("Capture processed and saved:", response.data.capture);
              
              // Refresh collection data
              loadCollectionData();
            } else {
              Alert.alert("No Animal Detected", "We couldn't identify any animals in this photo. Try taking another photo with a clearer view of the animal.");
            }
          } catch (error) {
            console.error("Error processing image:", error);
            Alert.alert("Error", "Failed to process your photo. Please try again.");
          }

          setPhotoUri(null);
        }}
      />
    );
  }

  // Return the live camera view.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* --- ANIMAL MODAL OVERLAY GOES HERE --- */}
        {showAnimalModal && (
          <View style={styles.modalOverlay}>
            {animalModalData.slice(currentCardIndex).map((animal, index) => {
              const isTopCard = index === 0;
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.animalCard,
                    { zIndex: animalModalData.length - index },
                    isTopCard && { transform: [{ scale: 1 }] },
                  ]}
                >
                  {animal_image_dict[animal.name] && (
                    <Image
                      source={animal_image_dict[animal.name]}
                      style={{ width: 120, height: 120, marginBottom: 20 }}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      marginBottom: 10,
                    }}
                  >
                    {animal.name}
                  </Text>
                  {isTopCard && (
                    <TouchableOpacity
                      onPress={() => {
                        if (currentCardIndex + 1 >= animalModalData.length) {
                          setShowAnimalModal(false);
                        } else {
                          setCurrentCardIndex((prev) => prev + 1);
                        }
                      }}
                      style={{
                        marginTop: 20,
                        paddingVertical: 10,
                        paddingHorizontal: 30,
                        backgroundColor: "#D4A373",
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {currentCardIndex + 1 >= animalModalData.length ? "Done" : "Next"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <GestureDetector gesture={pinchGesture}>
            <CameraView
              ref={(ref) => setCameraRef(ref)}
              style={{ flex: 1 }}
              facing={facing}
              zoom={zoomLevel}
            >
              <Animated.View style={[styles.topBar, buttonAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.profileIconButton}
                  onPress={() => {
                    router.push("/profile");
                  }}
                >
                  <IconSymbol name="person.fill" size={36} color="white" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[styles.buttonContainer, buttonAnimatedStyle]}
              >
                <TouchableOpacity
                  style={styles.utilButton}
                  onPress={toggleCameraType}
                >
                  <IconSymbol
                    name="arrow.triangle.2.circlepath"
                    size={32}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.utilButton}
                  onPress={toggleSheet}
                >
                  <IconSymbol name="arrow.down" size={28} color="white" />
                </TouchableOpacity>
              </Animated.View>
            </CameraView>
          </GestureDetector>
        </View>

          <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />

            {/* Collection Header */}
            <View style={styles.collectionHeader}>
              <View style={styles.collectionHeaderTop}>
                <Text style={styles.collectionTitle}>Your Collection</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    const toValue = SCREEN_HEIGHT - SHEET_PEEK_HEIGHT;
                    sheetTranslation.value = withSpring(toValue, {
                      damping: 20,
                      stiffness: 100,
                    });
                  }}
                >
                  <IconSymbol name="xmark" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.statsText}>
                {collectionLoading 
                  ? "Loading..." 
                  : `${collectionData.total} animals in your collection`
                }
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {collectionLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading your collection...</Text>
                </View>
              ) : collectionData.items.length > 0 ? (
                <View style={styles.gridContainer}>
                  {collectionData.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.collectionCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Find the actual capture data for this animal type with the highest rating
                        const captureData = captures.find(capture => 
                          capture.animal === item.animal_type && capture.rating === item.power
                        );
                        
                        if (captureData) {
                          router.push({
                            pathname: "/animal-detail",
                            params: {
                              animal: captureData.animal,
                              rating: captureData.rating.toString(),
                              foundBy: user?.username || "You",
                              foundByUsername: user?.username || "you",
                              capturedAt: captureData.capturedAt,
                              photo: captureData.photo,
                              latitude: captureData.latitude?.toString() || "0",
                              longitude: captureData.longitude?.toString() || "0",
                              from: "collection"
                            }
                          });
                        }
                      }}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.cardCount}>{item.power}</Text>
                        <Text style={styles.cardLabel}>{item.animal_type}</Text>
                      </View>
                      {animal_image_dict[item.animal_type] && (
                        <Image
                          source={animal_image_dict[item.animal_type]}
                          style={styles.cardIcon}
                          resizeMode="contain"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCollectionContainer}>
                  <Text style={styles.emptyCollectionText}>No animals captured yet</Text>
                  <Text style={styles.emptyCollectionSubtext}>
                    Start taking photos to build your collection
                  </Text>
                </View>
              )}

              {/* Bottom padding for scroll */}
              <View style={{ height: 100 }} />
            </ScrollView>
          </Animated.View>

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 20,
  },
  utilButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00000060",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#00000040",
  },
  captureButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#00000020",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FEFAE0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#D4A373",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 10, // Added margin from top
    marginBottom: 16,
  },
  collectionHeader: {
    marginBottom: 24,
    paddingTop: 60, // Increased padding for more space from top
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDC9",
  },
  collectionHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  collectionSubtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  categorySection: {
    marginBottom: 24,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: "#D4A373",
    fontWeight: "500",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#D4A373",
    marginBottom: 12,
    marginLeft: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  collectionCard: {
    width: "48%",
    aspectRatio: 1.2,
    backgroundColor: "#FAEDCD",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E9EDC9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardCount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#D4A373",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: "#CCD5AE",
    fontWeight: "600",
  },
  cardEmoji: {
    fontSize: 48,
    alignSelf: "flex-end",
    marginTop: -8,
  },
  cardIcon: {
    width: 64,
    height: 64,
    alignSelf: "flex-end",
    marginTop: -8,
  },
  button: {
    padding: 15,
    backgroundColor: "#00000080",
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontSize: 18,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    top: 60, // Adjust based on your safe area
    left: 20,
    zIndex: 10,
  },
  profileIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00000060",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileIconPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#D4A373",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  profileIconImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  animalCard: {
    width: 300,
    height: 400,
    borderRadius: 20,
    backgroundColor: "#FEFAE0",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyCollectionContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyCollectionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyCollectionSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
