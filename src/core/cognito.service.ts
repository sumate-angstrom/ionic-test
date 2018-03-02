import { Injectable } from '@angular/core'

import * as AWS from 'aws-sdk/global'
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'

import { NotificationService } from '../core'

//======================================================================
// Service: CognitoService - Authentication service through AWS Cognito
//======================================================================
@Injectable()
export class CognitoService {

  //-------------------
  // Public properties
  //-------------------
  public static isSignedIn: boolean
  public static userAttributes: any = {}
  public static ready = false

  //--------------------
  // Private properties
  //--------------------
  private static awsRegion = 'ap-southeast-1';
  private static idenPoolId = 'ap-southeast-1:c52f5485-fbba-419e-bfcc-db4025c46547';
  private static logins = { 'cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_XcOnPEUZZ': '' };
  private static credentialProvider = 'cognito-idp.ap-south-1.amazonaws.com/ap-southeast-1_XcOnPEUZZ';
  private static userPoolId = 'ap-southeast-1_XcOnPEUZZ';
  private static clientId = '3pdl54f0jberqeqb97o74v0gdn'
  private static userPoolData = {
    UserPoolId: CognitoService.userPoolId,
    ClientId: CognitoService.clientId
  }

  //---------------------------------------------------
  // Method: init - Initialize service for AWS Cognito
  //---------------------------------------------------
  public static init(): Promise<any> {
    let signedIn = JSON.parse(sessionStorage.getItem('signedIn'))
    this.isSignedIn = signedIn
    return new Promise((resolve, reject) => {
      AWS.config.region = this.awsRegion
      let cognitoUser = this.getCurrentUser()
      if (cognitoUser && this.isSignedIn) {
        // Restore credentials after browser refresh
        cognitoUser.getSession((sessionError, tokens) => {
          if (tokens) {
            // Restore AWS credentials
            this.logins[this.credentialProvider] = tokens.getIdToken().getJwtToken()
            let credentials = new AWS.CognitoIdentityCredentials({
              IdentityPoolId: this.idenPoolId,
              Logins: this.logins
            })
            credentials.refresh((refreshError) => {
              if (refreshError) {
                console.log('Error ' + refreshError.code + ': ' + refreshError.message)
                reject(refreshError)
              } else {
                AWS.config.credentials = credentials
                this.ready = true
                resolve('Success')
              }
            })
          } else {
            reject(sessionError)           
          }
        })
      } else {
        this.isSignedIn = false
        sessionStorage.setItem('signedIn', JSON.stringify(this.isSignedIn))
        this.ready = true
        resolve('Success - No signed in user')
      }
    })
  }

  //----------------------------------------------
  // Method: authenticate - Authenticate the user
  //----------------------------------------------
  public static authenticate(userName: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let userPool = new CognitoUserPool(this.userPoolData)
      let cognitoUser = new CognitoUser({
        Username: userName,
        Pool: userPool
      })
      let authenDetails = new AuthenticationDetails({
        Username: userName,
        Password: password
      })
      // Authenticate user with AWS User Pool
      cognitoUser.authenticateUser(authenDetails, {
        onSuccess: (tokens) => {
          // Change credentials to authenticated identity
          this.logins[this.credentialProvider] = tokens.getIdToken().getJwtToken();
          let credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: this.idenPoolId,
            Logins: this.logins
          })

          NotificationService.registerToken().then(
              (success) => console.log("register success"),
              (error) => console.log("register fail")
          );

          // Get AWS credentials
          credentials.clearCachedId()
          credentials.refresh((refreshError) => {
            if (refreshError) {
              console.log('Error ' + refreshError.code + ': ' + refreshError.message)
              reject(refreshError)
            } else {
              AWS.config.credentials = credentials
              // Retrieve user attributes
              cognitoUser.getUserAttributes((getAttrError, attributes) => {
                if (getAttrError) {
                  reject(getAttrError)
                } else {
                  // Convert user attribute array to JSON
                  for (let i = 0; i < attributes.length; i++) {
                    this.userAttributes[attributes[i].getName()] = attributes[i].getValue()
                  }
                  this.isSignedIn = true
                  sessionStorage.setItem('signedIn', JSON.stringify(this.isSignedIn))
                  resolve('Success')
                }
              })
            }
          })
        },
        onFailure: (authenError) => reject(authenError)
      })
    })
  }

  //-----------------------------------------
  // Method: signOut - Sign out from proZper
  //-----------------------------------------
  public static signOut(): void {
    let cognitoUser = this.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
      this.userAttributes = {}
      this.isSignedIn = false
      sessionStorage.setItem('signedIn', JSON.stringify(this.isSignedIn))
    }
  }

  //----------------------------------------------------------
  // Method: refreshCredentials - Refresh expired credentials
  //----------------------------------------------------------
  public static refreshCredentials(): Promise<any> {
    return new Promise((resolve, reject) => {
      let cognitoUser = this.getCurrentUser()
      if (cognitoUser) {
        cognitoUser.getSession((sessionError, tokens) => {
          if (tokens) {
            // Restore AWS credentials
            this.logins[this.credentialProvider] = tokens.getIdToken().getJwtToken()
            let credentials = new AWS.CognitoIdentityCredentials({
              IdentityPoolId: this.idenPoolId,
              Logins: this.logins
            })
            credentials.refresh((refreshError) => {
              if (refreshError) {
                console.log('Error ' + refreshError.code + ': ' + refreshError.message)
                reject(refreshError)
              } else {
                AWS.config.credentials = credentials
                resolve('Success')
              }
            })
          } else
            reject(sessionError)
        })
      } else {
        resolve('No User')
      }
    });
  }

  //-----------------------------------------------------------
  // Method: changePassword - Change the user sign in password
  //-----------------------------------------------------------
  public static changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let cognitoUser = this.getCurrentUser()
      if (cognitoUser) {
        cognitoUser.getSession((sessionError, session) => {
          if (session) {
            cognitoUser.changePassword(oldPassword, newPassword, (changePwdError, result) => {
              if (changePwdError) {
                reject(changePwdError)
              } else {
                resolve(result)
              }
            })
          } else {
            reject(sessionError)
          }
        })
      } else {
        reject('No signed in user')
      }
    })
  }

  //--------------------------------------------------
  // Method: isReady - Check whether service is ready
  //--------------------------------------------------
  public static isReady(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.ready && this.isSignedIn) {
        resolve('Ready')
      } else {
        let counter = 0;
        let checkInterval = setInterval(() => {
          counter = counter + 50
          if (this.ready) {
            clearInterval(checkInterval);
            resolve('Ready')
          } else if (counter > 10000) {
            clearInterval(checkInterval);
            reject('Timeout')
          }
        }, 50)
      }
    })
  }

  //----------------------------------------------------
  // Method: getCurrentUserName - Get current user name
  //----------------------------------------------------
  public static getCurrentUserName() {
    let cognitoUser = new CognitoUserPool(this.userPoolData).getCurrentUser()
    return cognitoUser ? cognitoUser.getUsername() : null
  }

  //-----------------------------------------------------
  // Method: getCurrentUser - Get current signed in user
  //-----------------------------------------------------
  private static getCurrentUser() {
    return new CognitoUserPool(this.userPoolData).getCurrentUser()
  }
}