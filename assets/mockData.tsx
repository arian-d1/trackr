// app/assets/mockData.ts

export type Animal = {
    latitude: number;
    longitude: number;
    animal: string;
    image: any; // For local require images
  };
  
  export const mockData: Animal[] = [
    {
      latitude: 49.2827,
      longitude: -123.1207,
      animal: "Crow",
      image: require("./images/crow.png"),
    },
    {
      latitude: 49.2835,
      longitude: -123.1180,
      animal: "Goose",
      image: require("./images/goose-png-clipart-9.png"),
    },
    {
      latitude: 49.2800,
      longitude: -123.1234,
      animal: "Grizzly",
      image: require("./images/grizzly.png"),
    },
    {
      latitude: 49.2850,
      longitude: -123.1190,
      animal: "Pigeon",
      image: require("./images/pigeon-clipart-xl.png"),
    },
    {
      latitude: 49.2812,
      longitude: -123.1250,
      animal: "Squirrel",
      image: require("./images/pngtree-free-squirrel-vector-png-image_6880815.png"),
    },
    {
      latitude: 49.2840,
      longitude: -123.1220,
      animal: "Raccoon",
      image: require("./images/racoon-cute-cartoon-clipart.png"),
    },
  ];
  