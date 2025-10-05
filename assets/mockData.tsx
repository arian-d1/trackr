// app/assets/mockData.ts

export type Animal = {
  latitude: number;
  longitude: number;
  animal: string;
  image: any; // For local require images
  foundBy: string;
  profilePic: string;
};

export const mockData: Animal[] = [
  {
    latitude: 49.2827,
    longitude: -123.1207,
    animal: "Crow",
    image: require("./images/crow.png"),
    foundBy: "",
    profilePic: "",
  },
  {
    latitude: 49.2835,
    longitude: -123.118,
    animal: "Goose",
    image: require("./images/goose-png-clipart-9.png"),
    foundBy: "",
    profilePic: "",
  },
  {
    latitude: 49.28,
    longitude: -123.1234,
    animal: "Grizzly",
    image: require("./images/grizzly.png"),
    foundBy: "",
    profilePic: "",
  },
  {
    latitude: 49.285,
    longitude: -123.119,
    animal: "Pigeon",
    image: require("./images/pigeon-clipart-xl.png"),
    foundBy: "",
    profilePic: "",
  },
  {
    latitude: 49.2812,
    longitude: -123.125,
    animal: "Squirrel",
    image: require("./images/pngtree-free-squirrel-vector-png-image_6880815.png"),
    foundBy: "",
    profilePic: "",
  },
  {
    latitude: 49.284,
    longitude: -123.122,
    animal: "Raccoon",
    image: require("./images/racoon-cute-cartoon-clipart.png"),
    foundBy: "",
    profilePic: "",
  },
];
