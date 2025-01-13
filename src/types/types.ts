export interface Map {
    id: number;
    name: string;
    imageUrl: string;
    isMainMap: boolean;
    locations?: Location[]; // Optional if locations are not always included
  }
  
  export interface Location {
    xCoordinate: string | number | readonly string[] | undefined;
    yCoordinate: string | number | readonly string[] | undefined;
    id: number;
    name: string;
    description: string;
  }
  