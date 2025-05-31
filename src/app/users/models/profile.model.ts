export class Profile {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate: Date;
  description?: string;
  photo?: string;
  userId: number;

  constructor(
    firstName: string,
    lastName: string,
    birthDate: Date,
    userId: number,
    description?: string,
    photo?: string,
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthDate = birthDate;
    this.userId = userId;
    this.description = description;
    this.photo = photo;
  }


}
