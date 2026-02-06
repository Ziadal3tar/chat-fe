import { UserService } from './user.service';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private UserService:UserService,
    private Router:Router,

  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

return this.UserService.user$.pipe(
  map((data: any) => {
    if (data) return true;

    this.UserService.getUserData();
    const token = localStorage.getItem('token');
    if (token) {


      return true;
    }

    return this.Router.createUrlTree(['/login']);
  })
);


  }
}

