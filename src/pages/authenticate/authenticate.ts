import { Component } from '@angular/core';

import { CognitoService } from '../../core';

@Component({
  selector: 'page-authenticate',
  templateUrl: 'authenticate.html'
})
export class Authenticate {

  private isLogin: boolean;
  private user: string = ""; 
  private pass: string = "";

  constructor() {
    this.isLogin = false;
  }

  login() : void{
    CognitoService.authenticate(this.user, this.pass).then(
      (success) => this.isLogin = true,
      (error) => console.log(error)
    );
  }

  logout() : void{
    this.isLogin = false;
  }
}
