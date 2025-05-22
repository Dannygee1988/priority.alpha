export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Stat {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}