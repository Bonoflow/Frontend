export class ClientModel {
  id?: number;
  userId: number;


  constructor(userId: number, id?: number) {
    this.id = id;
    this.userId = userId;
  }



}
