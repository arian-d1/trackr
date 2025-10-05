import { IconSymbol } from "@/components/ui/icon-symbol";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PhotoPreview from "@/components/PhotoPreview";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";

import { processImageBase64 } from "../util/gemini";

import { useRouter } from "expo-router";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const collectionData = {
  items: [
    { id: 1, user_id: 1, power: 122, animal_type: "Raccoon", image_uri: "/" },
    { id: 2, user_id: 1, power: 1532, animal_type: "Squirrel", emoji: "/" },
    { id: 3, user_id: 1, power: 43, animal_type: "Bear", emoji: "/" },
    { id: 4, user_id: 1, power: 3824, animal_type: "Pigeon", emoji: "/" },
    { id: 5, user_id: 1, power: 232, animal_type: "Pigeon", emoji: "/" },
    { id: 6, user_id: 1, power: 453, animal_type: "Crow", emoji: "/" },
    { id: 7, user_id: 1, power: 252, animal_type: "Goose", emoji: "/" },
  ],
  total: 7,
};

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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnimalModal, setShowAnimalModal] = useState(false);

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

  const cameraAnimatedStyle = useAnimatedStyle(() => {
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

  const toggleCameraType = () => {
    setFacing((facing) => (facing === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef && locationPermission) {
      try {
        const photo = await cameraRef.takePictureAsync();
        const current = await Location.getCurrentPositionAsync({});
        setLocation(current);
        setPhotoUri(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
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

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslation = sheetTranslation.value + event.translationY;
      if (
        newTranslation >= 0 &&
        newTranslation <= SCREEN_HEIGHT - SHEET_PEEK_HEIGHT
      ) {
        sheetTranslation.value = newTranslation;
      }
    })
    .onEnd(() => {
      if (sheetTranslation.value < SCREEN_HEIGHT / 2) {
        sheetTranslation.value = withSpring(0);
      } else {
        sheetTranslation.value = withSpring(SCREEN_HEIGHT - SHEET_PEEK_HEIGHT);
      }
    });

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
            const response = await processImageBase64(base64Image);

            if (response.animals && response.animals.length > 0) {
              setAnimalModalData(response.animals);
              setCurrentCardIndex(0);
              setShowAnimalModal(true);
            }
            console.log(response);
          } catch (error) {
            console.error("Error processing image:", error);
          }

          setPhotoUri(null);
        }}
      />
    );
  }

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
                        Next
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        <Animated.View style={[{ flex: 1 }, cameraAnimatedStyle]}>
          <CameraView
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            facing={facing}
          >
            <Animated.View style={[styles.topBar, buttonAnimatedStyle]}>
              <TouchableOpacity
                style={styles.profileIconButton}
                onPress={() => {
                  // Navigate to profile screen
                  router.push("/profile");
                }}
              >
                <IconSymbol name="gearshape.fill" size={36} color="white" />
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

              <TouchableOpacity style={styles.utilButton} onPress={toggleSheet}>
                <IconSymbol name="arrow.down" size={28} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </CameraView>
        </Animated.View>

        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />

            {/* Collection Header */}
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionTitle}>Your Collection</Text>
              <Text style={styles.statsText}>
                {collectionData.items.length} animals in your collection
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Grid of all animals */}
              <View style={styles.gridContainer}>
                {collectionData.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.collectionCard}
                    activeOpacity={0.7}
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

              {/* Bottom padding for scroll */}
              <View style={{ height: 100 }} />
            </ScrollView>
          </Animated.View>
        </GestureDetector>
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
    top: 0,
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
    marginBottom: 16,
  },
  collectionHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EDC9",
  },
  collectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
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
});
