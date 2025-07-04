export class Profile {
  id?: number;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  description?: string;
  photo?: string;
  userId: number;
  company ?: string;
   ruc?: string;

  constructor(
    firstName: string,
    lastName: string,
    birthDate: Date,
    userId: number,
    description?: string,
    photo?: string,
    company?: string,
    ruc?: string
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthDate = birthDate;
    this.userId = userId;
    this.description = description;
    this.photo = photo;
    this.company = company;
    this.ruc = ruc;
  }


}
