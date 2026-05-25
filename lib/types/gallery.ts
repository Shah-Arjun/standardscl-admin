export interface GalleryImage {
  id: number;
  title: string;
  category:
    | "School"
    | "Teachers"
    | "Students"
    | "Events"
    | "Sports"
    | "Arts"
    | "Activities"
    | "Educational Tour"
    | "Memories";
  photoPublicId: string;
  url: string;
  createdAt: Date | string;
}
