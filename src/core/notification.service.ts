import { Injectable } from '@angular/core'
import { Push, PushObject, PushOptions } from '@ionic-native/push';

import * as Lambda from 'aws-sdk/clients/lambda';
import * as SNS from 'aws-sdk/clients/sns';
// import * as AWS from 'aws-sdk/global'

@Injectable()
export class NotificationService {

    public static deviceToken: string;
    public static push: Push = new Push();
    public static pushObject: PushObject;

    // public static initialize(): void{
        
    // }

    public static registerToken() {
        this.push.hasPermission().then((res: any) => {
            // if (res.isEnabled) {
            //     alert('We have permission to send push notifications');
            // } else {
            //     alert('We do not have permission to send push notifications');
            // }
        });
        return new Promise((resolve, reject) => {
            const pushOptions: PushOptions = {
                android: {
                    senderID : '437832062456'
                    // sound: true,
                    // vibrate: true
                },
                // browser: {
                //     pushServiceURL: 'http://push.api.phonegap.com/v1/push'
                // },
                ios: {},
                windows: {},
            };
            this.pushObject = this.push.init(pushOptions);
            this.pushObject.on('registration').subscribe(
                (registration : any) => {
                    alert(registration.registrationId);
                    let sns = new SNS({ region: 'ap-southeast-1', apiVersion: '2010-03-31' });
                    let params = {
                        PlatformApplicationArn: 'arn:aws:sns:ap-southeast-1:525747303798:app/GCM/push-test', 
                        Token: registration.registrationId
                    }
                    sns.createPlatformEndpoint(params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                    });
                    NotificationService.deviceToken = registration.registrationId;
                    console.log(this.deviceToken);
                    resolve('success');
                } 
            );
            this.pushObject.on('notification').subscribe((data : any) => {
                alert(data);
            });
            this.pushObject.on('error').subscribe((error: any) => {
                console.log('error on push')
                alert(error)
                reject(error);
            });
        });
    }

}