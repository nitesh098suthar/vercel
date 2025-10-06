import { Gender } from "@prisma/client";

export interface CreateTeacher {
  name?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  email?: string;
  gender?: Gender;
  salary?: number;
  experienceYear?: number;
  address?: string;
  password?: string;
  profilePhoto?: string;
}
