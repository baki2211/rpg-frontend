export interface Race {
  id: number;
  name: string;
  description: string;
  baseHp: number;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  skillPointCost: number;
  branchId: number;
  typeId: number;
  rank: number;
  isPassive: boolean;
  target: 'self' | 'other' | 'none' | 'any';
  branch: {
    name: string;
  };
  type: {
    name: string;
  };
}

export interface Character {
  id: number;
  userId: number;
  name: string;
  surname: string;
  age: number;
  gender: string;
  race: Race;
  isActive: boolean;
  imageUrl?: string;
  skills: Skill[];
  skillPoints: number;
  isNPC?: boolean;
}

export interface ActiveCharacterStatus {
  userCharacters: Character[];
  assignedNPCs: Character[];
  activeCount: number;
  hasConflict: boolean;
}
