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
      image: require("./images/goose.png"),
    },
    {
      latitude: 49.2800,
      longitude: -123.1234,
      animal: "Grizzly",
      image: require("./images/bear.png"),
    },
    {
      latitude: 49.2850,
      longitude: -123.1190,
      animal: "Pigeon",
      image: require("./images/pigeon.png"),
    },
    {
      latitude: 49.2812,
      longitude: -123.1250,
      animal: "Squirrel",
      image: require("./images/squirrel.png"),
    },
    {
      latitude: 49.2840,
      longitude: -123.1220,
      animal: "Raccoon",
      image: require("./images/raccoon.png"),
    },
  ];
  