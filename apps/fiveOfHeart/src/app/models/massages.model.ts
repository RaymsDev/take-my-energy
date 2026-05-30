export interface MassageSection {
  subtitle: string;
  text: string;
}

export interface MassageBlock {
  image: string;
  alt: string;
  sections: MassageSection[];
}

export interface MassageContent {
  title: string;
  blocks: MassageBlock[];
}

export interface MassageHomeContent {
  title: string;
  imageSrc: string;
  imageAlt: string;
  route: string;
}
