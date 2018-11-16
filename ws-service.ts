import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

const WS_DOMAIN: string = "ws://192.168.11.195/ws/1/";

@Injectable()
export class WsServiceProvider {
    WS_URL = {
        user_login: "user/login",               //用户登录
        register_guest: "user/register_guest",   //游客注册
        login_guest: "user/login_guest",   //游客登录
    }
    public ws: WebSocket;
    public callback_list:{url:string,callback:Function}[] = []; //函数表

    constructor(
        private toastCtrl: ToastController,
    ) {
        this.init();
    }
    /**
     * websocket初始化
     */
    public init() {
        if (this.ws) {
            return;
        }
        this.ws = new WebSocket(WS_DOMAIN);
        this.ws.onopen = () => {
            console.log("websocket 连接...");
        }
        this.ws.onmessage = (evt) => {
            console.log('websocket 接收到了一条新数据...');
            let a = evt.data.indexOf("{");
            if (a == -1) {
                console.log(`当前服务器时间为:${evt.data}`)
                return;
            }
            let data = evt.data.slice(a);
            if (this.callback_list.length != 0) {
                let index = -1;
                this.callback_list.forEach((i,dex) => {
                    let isOk = evt.data.indexOf(i.url);
                    if(isOk >0){
                        index = dex;
                        i.callback(JSON.parse(data));
                        return;
                    }
                });
                if(index >=0){
                    this.callback_list.splice(index,1);
                }
            }
        };
        this.ws.onclose = (evt) => {
            console.log('websocket 连接关闭...');
        }
        this.ws.onerror = (err) => {
            console.log('websocket 出现问题....')
            console.log(err);
        }
    }
    /**
     * 关闭ws
     * @returns 是否关闭成功
     */
    public ws_close(): boolean {
        if (this.ws) {
            if (this.ws.readyState == WebSocket.OPEN) {
                this.ws.close();
                return true;
            }
        }
        return false;
    }
    /**
     * 打开ws
     * @returns 是否开启成功
     */
    public ws_open(): boolean {
        if (this.ws) {
            if (this.ws.readyState == WebSocket.CLOSED) {
                this.ws = null;
                this.init();
                return true;
            }
        }
        return false;
    }
    /**
     * 发送请求
     * @param url 接口url
     * @param data 传递数据
     * @param callback 回调函数
     * @returns 是否发送成功
     */
    public ws_send(url: string, data: any, callback: Function): boolean {
        if (this.ws.readyState == WebSocket.OPEN) {
            this.ws.send(`DO ${url} ${data}`);
            this.callback_list.push({"url":url,"callback":callback});
            // this.callback = callback;
            return true;
        }
        let toast = this.toastCtrl.create({
            message: `当前websocket状态为:${this.ws.readyState},稍后重新连接.`,
            duration: 1000,
            position: 'top'
        });

        toast.onDidDismiss(() => {
            this.ws_open();
            this.send_url(url,data,callback);
        });

        toast.present();
        return false;
    }

    public send_url(url: string, data: any, callback: Function){
        this.ws.send(`DO ${url} ${data}`);
        this.callback_list.push({"url":url,"callback":callback});
    }
}
