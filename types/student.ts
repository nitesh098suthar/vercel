import { Gender } from "@prisma/client";

export interface CreateStudent {
  name?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  guardianPhone?: string;
  address?: string;
  gender?: Gender;
  rollNumber?: number;
  password?: string;
  profilePhoto?: string;
}
