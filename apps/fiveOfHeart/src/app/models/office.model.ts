export interface OfficeContent {
  id: string;
  title: string;
  address?: string;
  blocks?: {
    image: string;
    alt: string;
    descriptions: string[];
  }[];
}
