import { Component } from '@angular/core';

import { CognitoService } from '../../core';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html'
})
export class SignUp {

  private user: string = ""; 
  private pass: string = "";

  constructor() {

  }

  signup() : void{
    CognitoService.signUp(this.user, this.pass);
  }
}
