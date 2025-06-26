import { Injectable } from '@angular/core';
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";

//Import the user model
import {User} from "../models/user.model";
import {BaseService} from '../../shared/services/base.service';
import {BehaviorSubject} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserApiService extends  BaseService<User>{
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.userURL;
  }

  private isInvestorSubject = new BehaviorSubject<boolean>(this.getIsInvestor());
  isInvestor$ = this.isInvestorSubject.asObservable();

  private loggedIn = new BehaviorSubject<boolean>(this.isLogged());
  get isLogged$() {
    return this.loggedIn.asObservable();
  }

  setLogged(isLogged: boolean){
    // Check if the window object is defined (prevent error from server side rendering)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('isLogged', String(isLogged));
    }
  }

  isLogged() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const logged = localStorage.getItem('isLogged');
      return logged === 'true';
    }
    return false;
  }

  setIsInvestor(isInvestor: boolean) {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.isInvestorSubject.next(isInvestor);
      localStorage.setItem('isInvestor', String(isInvestor));
    }

  }

  getIsInvestor(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const isInvestor = localStorage.getItem('isInvestor');
      return isInvestor === 'true';
    }
    return false;
  }

  getIsDoctor(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const isDoctor = localStorage.getItem('isDoctor');
      return isDoctor === 'true';
    }
    return false;
  }

  setUserId(user_id: number) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('user_id', user_id.toString());
    }
  }

  getUserId(): number {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user_id = localStorage.getItem('user_id');
      return user_id ? parseInt(user_id) : 0;
    }
    return 0;
  }





}
