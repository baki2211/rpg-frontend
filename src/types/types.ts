export interface Map {
    id: number;
    name: string;
    imageUrl: string;
    isMainMap: boolean;
    locations?: Location[]; // Optional if locations are not always included
  }
  
  export interface Location {
    id: number;
    name: string;
    description: string;
    x: number;
    y: number;
  }
  