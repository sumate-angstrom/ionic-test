import { Injectable } from '@angular/core'
import { Push, PushObject, PushOptions } from '@ionic-native/push';

import * as Lambda from 'aws-sdk/clients/lambda';
import * as SNS from 'aws-sdk/clients/sns';

@Injectable()
export class NotificationService {

    public static deviceToken: string;
    public static push: Push;

    public static initialize(): void{
        this.push = new Push();
    }

    public static registerToken() {
        if(!this.push) return;
        this.push.hasPermission();
        return new Promise((resolve, reject) => {
            let pushOptions: PushOptions = {
                android: {
                    senderID : "46363674915",
                    sound: true,
                    vibrate: true
                },
                browser: {
                    pushServiceURL: 'http://push.api.phonegap.com/v1/push'
                },
                ios: {
                    alert: 'true',
                    badge: true,
                    sound: 'false'
                },
                windows: {},
            };
            let pushObject: PushObject = this.push.init(pushOptions);
            pushObject.on('registration').subscribe(
                (registration) => {
                    let sns = new SNS({ region: 'ap-southeast-1', apiVersion: '2010-03-31' });
                    let params = {
                        PlatformApplicationArn: 'arn:aws:sns:ap-southeast-1:525747303798:app/GCM/push-test', 
                        Token: registration.registrationId
                    }
                    sns.createPlatformEndpoint(params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                    });
                    // NotificationService.deviceToken = registration.registrationId;
                    // console.log(this.deviceToken);
                    resolve('success');
                } 
            );
            pushObject.on('error').subscribe((error: any) => {
                console.log('error on push')
                alert('Error with push plugin' + error)
                reject(error);
            });
        });
  }

}