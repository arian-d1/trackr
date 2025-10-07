import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnimalDetailProps = {
  animal: string;
  rating: number;
  foundBy: string;
  foundByUsername: string;
  capturedAt: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
};

export default function AnimalDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const from = params.from as string;
  
  // Parse the animal data from URL params
  const animalData: AnimalDetailProps = {
    animal: params.animal as string || "Unknown",
    rating: parseInt(params.rating as string) || 50,
    foundBy: params.foundBy as string || "Unknown",
    foundByUsername: params.foundByUsername as string || "",
    capturedAt: params.capturedAt as string || new Date().toISOString(),
    photo: params.photo as string,
    latitude: parseFloat(params.latitude as string),
    longitude: parseFloat(params.longitude as string),
  };

  const getAnimalEmoji = (animalName: string): string => {
    const emojiMap: { [key: string]: string } = {
      "Raccoon": "🦝",
      "Squirrel": "🐿️",
      "Bear": "🐻",
      "Pigeon": "🕊️",
      "Crow": "🐦‍⬛",
      "Goose": "🪿",
      "Dog": "🐕"
    };
    return emojiMap[animalName] || "🐾";
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 80) return "#4CAF50"; // Green
    if (rating >= 60) return "#FF9800"; // Orange
    if (rating >= 40) return "#FFC107"; // Yellow
    return "#F44336"; // Red
  };

  const getRatingText = (rating: number): string => {
    if (rating >= 90) return "Legendary";
    if (rating >= 80) return "Epic";
    if (rating >= 70) return "Rare";
    if (rating >= 60) return "Uncommon";
    if (rating >= 40) return "Common";
    return "Basic";
  };

  const getAnimalInfo = (animalName: string) => {
    const animalInfo: { [key: string]: { description: string; habitat: string; diet: string; funFacts: string[] } } = {
      "Raccoon": {
        description: "Raccoons are highly intelligent mammals known for their distinctive black mask and ringed tail. They are excellent climbers and have dexterous front paws.",
        habitat: "Forests, urban areas, and wetlands across North America",
        diet: "Omnivorous - eats fruits, nuts, insects, small animals, and human food",
        funFacts: [
          "Raccoons can remember solutions to tasks for up to 3 years",
          "They wash their food before eating (though not with soap!)",
          "Their front paws have 5 fingers that work like human hands"
        ]
      },
      "Squirrel": {
        description: "Squirrels are small to medium-sized rodents known for their bushy tails and incredible jumping abilities. They are active during the day and are excellent tree climbers.",
        habitat: "Forests, parks, and urban areas worldwide",
        diet: "Nuts, seeds, fruits, and occasionally insects or small animals",
        funFacts: [
          "Squirrels can jump up to 20 feet horizontally",
          "They plant thousands of trees by forgetting where they buried nuts",
          "Their teeth never stop growing throughout their lifetime"
        ]
      },
      "Bear": {
        description: "Bears are large, powerful mammals with strong limbs and sharp claws. They are excellent swimmers and climbers, and have an incredible sense of smell.",
        habitat: "Forests, mountains, and tundra in North America, Europe, and Asia",
        diet: "Omnivorous - varies by species (fish, berries, nuts, small mammals)",
        funFacts: [
          "Bears can run up to 35 mph for short distances",
          "They can smell food from over a mile away",
          "Black bears can climb trees, but grizzlies cannot"
        ]
      },
      "Pigeon": {
        description: "Pigeons are intelligent birds with excellent navigation abilities. They have been used for communication throughout history and are found in cities worldwide.",
        habitat: "Urban areas, cliffs, and rocky coastlines globally",
        diet: "Seeds, grains, fruits, and small insects",
        funFacts: [
          "Pigeons can recognize themselves in mirrors",
          "They were used to deliver messages in both World Wars",
          "Pigeons can find their way home from over 1,000 miles away"
        ]
      },
      "Crow": {
        description: "Crows are highly intelligent birds known for their problem-solving abilities and complex social structures. They are among the smartest of all birds.",
        habitat: "Forests, fields, and urban areas worldwide",
        diet: "Omnivorous - insects, small animals, fruits, seeds, and carrion",
        funFacts: [
          "Crows can recognize human faces and hold grudges",
          "They use tools and can solve complex puzzles",
          "Crows hold 'funerals' for their dead"
        ]
      },
      "Goose": {
        description: "Geese are large waterfowl known for their V-shaped flight formations and loud honking. They are excellent swimmers and flyers with strong family bonds.",
        habitat: "Lakes, ponds, rivers, and grasslands worldwide",
        diet: "Grass, aquatic plants, seeds, and small insects",
        funFacts: [
          "Geese mate for life and mourn the loss of their partner",
          "They fly in V-formation to conserve energy during migration",
          "A group of geese is called a 'gaggle' on land and a 'skein' in flight"
        ]
      },
      "Dog": {
        description: "Dogs are domesticated canines and humanity's oldest animal companions. They come in hundreds of breeds with diverse sizes, temperaments, and abilities.",
        habitat: "Found worldwide as companion animals and working dogs",
        diet: "Omnivorous - commercial dog food, meat, vegetables, and grains",
        funFacts: [
          "Dogs can learn over 150 words and gestures",
          "They have a sense of smell 40 times better than humans",
          "Dogs dream just like humans do"
        ]
      }
    };
    
    return animalInfo[animalName] || {
      description: "This is a fascinating wildlife species that you've discovered in your area. Each animal has unique characteristics and behaviors that make them special.",
      habitat: "Various habitats depending on the species",
      diet: "Diet varies by species and environment",
      funFacts: [
        "Every animal plays an important role in its ecosystem",
        "Wildlife observation helps us understand nature better",
        "Conservation efforts help protect these amazing creatures"
      ]
    };
  };

  const handleLearnEvenMore = async () => {
    try {
      // Create a more specific search query for the animal
      const searchQuery = encodeURIComponent(`Tell me everything about ${animalData.animal} animals: their behavior, habitat, diet, and interesting facts`);
      // Use a clean Google search that should show AI results naturally
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      // Open the web browser with Google AI mode
      await WebBrowser.openBrowserAsync(searchUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: "#D4A373",
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: true,
      });
    } catch (error) {
      console.error("Error opening web browser:", error);
      Alert.alert(
        "Error",
        "Could not open web browser. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleViewProfile = () => {
    if (animalData.foundByUsername) {
      router.push({
        pathname: "/person-profile",
        params: { username: animalData.foundByUsername }
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // Always use router.back() to return to the previous screen
            // This preserves the search state and navigation stack
            router.back();
          }}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Animal Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Animal Image */}
        <View style={styles.imageContainer}>
          {animalData.photo ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${animalData.photo}` }}
              style={styles.animalImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>
                {getAnimalEmoji(animalData.animal)}
              </Text>
            </View>
          )}
        </View>

        {/* Animal Info */}
        <View style={styles.infoContainer}>
          <View style={styles.animalHeader}>
            <Text style={styles.animalEmoji}>
              {getAnimalEmoji(animalData.animal)}
            </Text>
            <View style={styles.animalNameContainer}>
              <Text style={styles.animalName}>{animalData.animal}</Text>
              <Text style={styles.animalType}>Wildlife Species</Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Power Rating</Text>
            <View style={styles.ratingBar}>
              <View 
                style={[
                  styles.ratingFill, 
                  { 
                    width: `${animalData.rating}%`,
                    backgroundColor: getRatingColor(animalData.rating)
                  }
                ]} 
              />
            </View>
            <View style={styles.ratingInfo}>
              <Text style={[styles.ratingValue, { color: getRatingColor(animalData.rating) }]}>
                {animalData.rating}/100
              </Text>
              <Text style={[styles.ratingText, { color: getRatingColor(animalData.rating) }]}>
                {getRatingText(animalData.rating)}
              </Text>
            </View>
          </View>

          {/* Found By */}
          <View style={styles.foundByContainer}>
            <Text style={styles.foundByLabel}>Found by</Text>
            <TouchableOpacity 
              style={styles.foundByButton}
              onPress={handleViewProfile}
            >
              <Text style={styles.foundByText}>{animalData.foundBy}</Text>
              <IconSymbol name="chevron.right" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Location */}
          {animalData.latitude && animalData.longitude && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Location</Text>
              <Text style={styles.locationText}>
                {animalData.latitude.toFixed(6)}, {animalData.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Captured At */}
          <View style={styles.capturedContainer}>
            <Text style={styles.capturedLabel}>Captured</Text>
            <Text style={styles.capturedText}>
              {new Date(animalData.capturedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Animal Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About {animalData.animal}</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoDescription}>
              {getAnimalInfo(animalData.animal).description}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Habitat</Text>
            <Text style={styles.infoText}>
              {getAnimalInfo(animalData.animal).habitat}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Diet</Text>
            <Text style={styles.infoText}>
              {getAnimalInfo(animalData.animal).diet}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Fun Facts</Text>
            {getAnimalInfo(animalData.animal).funFacts.map((fact, index) => (
              <View key={index} style={styles.factItem}>
                <Text style={styles.factBullet}>•</Text>
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.learnEvenMoreButton}
            onPress={handleLearnEvenMore}
          >
            <IconSymbol name="globe" size={20} color="#D4A373" />
            <Text style={styles.learnEvenMoreText}>Learn Even More</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFAE0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    backgroundColor: "#E9EDC9",
    justifyContent: "center",
    alignItems: "center",
  },
  animalImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E9EDC9",
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  infoContainer: {
    padding: 20,
  },
  animalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  animalEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  animalNameContainer: {
    flex: 1,
  },
  animalName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  animalType: {
    fontSize: 16,
    color: "#666",
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  ratingBar: {
    height: 8,
    backgroundColor: "#E9EDC9",
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingFill: {
    height: "100%",
    borderRadius: 4,
  },
  ratingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  foundByContainer: {
    marginBottom: 16,
  },
  foundByLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  foundByButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9EDC9",
  },
  foundByText: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  capturedContainer: {
    marginBottom: 24,
  },
  capturedLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  capturedText: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A373",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  learnMoreText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9EDC9",
  },
  infoDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1A1A1A",
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
  },
  factItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  factBullet: {
    fontSize: 16,
    color: "#D4A373",
    marginRight: 8,
    marginTop: 2,
  },
  factText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
    flex: 1,
  },
  learnEvenMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D4A373",
    gap: 8,
  },
  learnEvenMoreText: {
    color: "#D4A373",
    fontSize: 16,
    fontWeight: "600",
  },
});
