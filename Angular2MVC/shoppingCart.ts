import { userItem } from '../Model/userItem';
import { IUser } from "./user";


export class shoppingCart {
    Id: number; //a export interface uses commas to distinguish. an export class uses semicolons
    userId: number;
    userItemList: IUser[]; //we don't have users here so we must import it to use it here
}