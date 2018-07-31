import * as mySql from 'mysql';
import { Pool, PoolConnection} from "mysql";
import { Observable } from "rxjs/Observable";
import { Product, Comment } from "../model/model";

export class ProductPool {

    pool: Pool;

    constructor(){
        this.pool = mySql.createPool({
            host: '172.30.0.7',
            user: 'root',
            password: 'Uhope123',
            database: 'study_zgl',
            port: 3306
        })
    }

    getPool(): Pool {
       return this.pool;
    }

    getProducts(): Observable<Array<Product>> {
        let self = this;
        return Observable.create(function (observer) {
            self.pool.getConnection((error, conn) => {
                if (error) {
                    observer.error(error);
                    return;
                }
                conn.query('select * from product', (error, rs) => {
                    if (error) {
                        observer.error(error);
                        return;
                    }
                    observer.next(rs);
                    conn.release();
                    observer.complete();
                })
            });
        });
    }

    getComments(productId: String): Observable<Array<Comment>> {
        let self = this;
        return Observable.create(observer => {
            self.pool.getConnection((error, conn) => {
                if (error) {
                    observer.error(error);
                    return;
                }
                conn.query('select * from comment where productId = ?', productId, (error, rs) => {
                    if (error) {
                        observer.error(error);
                        return;
                    }
                    observer.next(rs);
                    conn.release();
                    observer.complete();
                })
            })
        })
    }

    getProductById(id: string): Observable<Product> {
        let self = this;
        return Observable.create(observer => {
            self.pool.getConnection((error, conn) => {
                if (error) {
                    observer.error(error);
                    return;
                }
                conn.query('select * from product where id = ?', id, (error, rs) => {
                    if (error) {
                        observer.error(error);
                        return;
                    }
                    observer.next(rs[0]);
                    conn.release();
                    observer.complete();
                })
            })
        })
    }

    searchProduct(params): Observable<Array<Product>> {
        let self = this;
        return Observable.create(observer => {
            self.pool.getConnection((error, conn) => {
                if (error) {
                    observer.error(error);
                    return;
                }
                conn.query('select * from product', (error, rs) => {
                    if (error) {
                        observer.error(error);
                        return;
                    }
                    // 返回满足条件的的货物
                    if(params.title) {
                        rs = rs.filter( (p: Product) => p.title.indexOf(params.title) !== -1);
                    }

                    if(rs.length > 0 && params.price) {
                        rs = rs.filter( (p: Product) => p.price <= parseInt(params.price));
                    }

                    if(rs.length > 0 && params.category !== '-1') {
                        console.log(rs);
                        rs = rs.filter((p: Product) => p.categories.indexOf(params.category) !== -1);
                        console.log("``````````````````" + params.category);
                        console.log(rs);
                    }
                    observer.next(rs);
                    conn.release();
                    observer.complete();
                })
            })
        })
    }
}