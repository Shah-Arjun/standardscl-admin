export interface Teacher {
  id: number;
  teacherName: string;
  gender?: "male" | "female" | "other" | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employmentType: string;
  qualifications?: string[] | null;
  subjectsTeaches?: string[] | null;
  post?: string[] | null;
  experience?: number | null;
  status?: string | null;
  photoPublicId?: string | null;
  photo?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}
