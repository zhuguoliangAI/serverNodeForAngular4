import * as express from 'express';
import * as path from 'path';
import { Product, Comment } from "../model/model";
import { Server } from "ws";
import { ProductPool } from "./pool";

// 如果服务端代码发生变化, node是不能感知到代码的变化的，需要重启服务
// 需要安装一个插件nodemon:会检测到代码的变化，自动重启服务
const app = express();

let products: Array<Product> = [];

let comments: Comment[] = [];

let productPool = new ProductPool();
let pool = productPool.getPool();


// 处理根目录的请求访问client/index.html
// 注意当前文件是ts文件，但是实际运行的是编译后的js的文件，所以访问index的路径要按照js的路径来写
// app.use('/', express.static(path.join(__dirname, '../..', 'client')));

app.get('/api/products', (req, res) => {
    productPool.getProducts()
        .subscribe((resp: Array<Product>) => {
            products = resp
            res.json(resp);
        }, error => {
            console.log('ERROR in getProducts API');
            console.log(error);
        })
});

app.get('/api/products/:id', (req, res) => {
    productPool.getProductById(req.params.id)
        .subscribe((resp: Product) => {
            res.json(resp);
        }, error => {
            console.log('ERROR in getProductById API');
            console.log(error);
        })
});

app.get('/api/comments/:id', (req, res) => {
    productPool.getComments(req.params.id)
        .subscribe((resp: Array<Comment>) => {
            res.json(resp);
        }, error => {
            console.log('ERROR in getComments API');
            console.log(error);
        })
});

app.get('/api/category', (req, res) => {
   res.json( ['电子图书','java', 'c#', 'c++']);
});

app.get('/api/search', (req, res) => {
    // let params = req.query;
    // let result = products;
    //
    // if(params.title) {
    //     result = result.filter( (p: Product) => p.title.indexOf(params.title) !== -1);
    // }
    //
    // if(result.length > 0 && params.price) {
    //     result = result.filter( (p: Product) => p.price <= parseInt(params.price));
    // }
    //
    // if(result.length > 0 && params.category !== '-1') {
    //     result = result.filter((p: Product) => p.categories.indexOf(params.category) !== -1);
    // }
    productPool.searchProduct(req.query)
        .subscribe((resp: Array<Product>) => {
            res.json(resp);
        }, error => {
            console.log('ERROR in searchProduct API');
            console.log(error);
        })
});


const server = app.listen(8001, () => {
    console.log('server start');
});



// ws

const wsServer = new Server({port: 8085});

// key是链接到wsServer的客户端 value是当前客户端所订阅的商品Id
const subscription = new Map<any, number[]>();

wsServer.on("connection", websocket => {
    // websocket.send("这个消息是服务器主动发送的啊！！！");
    websocket.on("message", message => {
        let msgObj = JSON.parse(message);
        let productIds = subscription.get(websocket) || [];
        subscription.set(websocket, [...productIds, msgObj.productId]);
        // console.log(subscription);
    });

    websocket.on("close", message => {
        console.log('ws closed');
    });
});

// 模拟商品的价格的变化 key是商品Id, value是商品最新的价格
const currentBids = new Map<number, number>();

setInterval( () => {
   // 模拟商品报价
    if (products != null || products.length > 0) {
        products.forEach((p: Product) => {
            // 获取最新的出价
            let curentBid = currentBids.get(p.id) || p.price;
            let newBid = p.price + Math.random() * 5;
            currentBids.set(p.id, newBid);
        });
    } else {
        productPool.getProducts()
            .subscribe((resp: Array<Product>) => {
                products = resp;
                products.forEach((p: Product) => {
                    // 获取最新的出价
                    let curentBid = currentBids.get(p.id) || p.price;
                    let newBid = p.price + Math.random() * 5;
                    currentBids.set(p.id, newBid);
                });
            }, error => {
                console.log('ERROR in getProducts API');
                console.log(error);
            })
    }


    subscription.forEach( ((productIds: number[], ws: any) => {
//         只读属性 readyState 表示连接状态，可以是以下值：
//
//          0 - 表示连接尚未建立。
//
//          1 - 表示连接已建立，可以进行通信。
//
//          2 - 表示连接正在进行关闭。
//
//          3 - 表示连接已经关闭或者连接不能打开。
        if(ws.readyState === 1) {
            let newBids = productIds.map( pid => (
                    {
                        'productId': pid,
                        'newBid': currentBids.get(pid)
                    }
                )
            );
            ws.send(JSON.stringify(newBids));
        } else {
            subscription.delete(ws);
        }
    }));
}, 2000);
