import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../Service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { IUser } from '../Model/user';
import { userItem } from '../Model/userItem';
import { shoppingCart } from '../Model/shoppingCart';
import { DBOperation } from '../Shared/enum';
import { Observable } from 'rxjs/Rx';
import { Global } from '../Shared/global';

@Component({
    templateUrl: 'app/Components/user.component.html'
})

export class UserComponent implements OnInit {

    @ViewChild('modal') modal: ModalComponent;
    users: IUser[];
    selectedUsers: IUser[] =[];
    user: IUser;
    msg: string;
    indLoading: boolean = false;
    userFrm: FormGroup;
    dbops: DBOperation;
    modalTitle: string;
    modalBtnTitle: string;
    listFilter: string;
    searchTitle: string = "Search User:";
    currentshoppingCart: shoppingCart; //create a null shopping cut at the beginning and call it shopping cart

    constructor(private fb: FormBuilder, private _userService: UserService) { }

    ngOnInit(): void {
        this.userFrm = this.fb.group({
            Id: [''],
            FirstName: ['', Validators.required],
            LastName: [''],
            Gender: ['', Validators.required]
        });
        this.LoadUsers();
        
    }

    checkboxChanged(userIdString: string) {
        var userId = parseInt(userIdString); //convert userId string to number. Parse Int at the beginning so it's ready to go later

        for (var i = 0; i < this.selectedUsers.length; i++) {
            if (this.selectedUsers[i].Id == userId) { //if the user id is equal to user id already in the list, then you want to remove it
                this.selectedUsers.splice(i, 1); //this is how to remove element from array
                return;
            }
        }
            //find user using the userId. you have all users in the user array when you load it. 
            var currentSelectedUser = this.findUserById(userId);  //this is the user you checked .create a new current selected user variable
            if (currentSelectedUser != null) {
                this.selectedUsers.push(currentSelectedUser);
            }
        }
        //if user is not in the selected user list. you have to go through the whole loop.

    findUserById(userId: number) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Id == userId) {
                return this.users[i];
            }
            return null; //in extreme scenario where user is deleted and can't be found'
        }
    }

    LoadUsers(): void {
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; },
            error => this.msg = <any>error);
    }

    addUser() {
        this.dbops = DBOperation.create;
        this.SetControlsState(true);
        this.modalTitle = "Add New User";
        this.modalBtnTitle = "Add";
        this.userFrm.reset();
        this.modal.open();
    }

    PurchaseItems() {
        //we should store by user id because different user ids have different carts. user stored in session storage. First retrieve user ID. we want this to expire.
        var currentUser = JSON.parse(sessionStorage.getItem("currentUser")); //you hav to use JSON to pass current user storage string to get the real user
        var selectedUserItemList = this.convertUserListToUserItemList(this.selectedUsers);
        var this.currentshoppingCart = JSON.parse(localStorage.getItem("currentshoppingCart" + currentUser.Id))//in local storage everything has a key. you're loading the shopping cart. we don't want this to expire

        //check to see if the user already has a shoppingcart stored in the local storage. if yes, then add to it. if not, then make one.
         
        
        if (this.currentshoppingCart == null) { //you use "this.currentshopping cart" because it's declared at the beginning. whatev eryo ustore in local/session storage is a string. json passes the local storage object to the shopping cart
            this.currentshoppingCart = new shoppingCart();
            this.currentshoppingCart.userId = currentUser.Id; //person who is doing the shopping
            this.currentshoppingCart.UserItemList = selectedUserItemList; //users on the list of people checked
        }
        else {
            //if the current shopping cart exists, then you do this. add to the list. load shopping cart based on current userId. all you need to change is the list of items
            this.currentshoppingCart.UserItemList = this.mergeItemList(this.currentshoppingCart.UserItemList, selectedUserItemList);
        }

        localStorage.setItem("currentshoppingCart" + currentUser.Id, JSON.stringify(currentshoppingCart));
    }

    convertUserListToUserItemList(selectedUsers: IUser[]) {
        var userItemList: userItem[] = []; //data type is user Item ; declare empty user item with empty []
        
        for (var i = 0; i < selectedUsers.length; i++) {
            var tempUserItem = new userItem();

            tempUserItem.Quantity = 1;
            tempUserItem.user = selectedUsers[i];
            tempUserItem.Subtotal = 10.00 * tempUserItem.Quantity; //assume price is standard 10 dollars
            userItemList.push(tempUserItem);//add to user item list
        }
        return userItemList;
    }

    mergeItemList(existingItems:userItem[], newItemList:userItem[]) {
        //do the work of comparing the two lists and then make changes to the current list
        //merging userItem Array
        var matchingFlag = false;
        for (var i = 0; i < existingItems.length; i++) { //put new item in the outer loop and existing item in the inner loop. which item list needs to be updated? existing or new?: new. so put that outside.

            var currentItem = existingItems[i];
            matchingFlag = false; //every time you retrieve a new current item, reset matching flag to false to ensure you're seeing if the actual current item is already in the list

            for (var j = 0; j < newItemList.length; j++) { //if current Item matches existing item
                if (currentItem.user.Id == newItemList[j].user.Id) { //use the ".user.Id" to compare the numbers rather than using jsut the memory item. every time you create a new product, it's comparing the memory address, not hte object itself. use the key which is the uper Id'
                    //if Ids match, the new items are duplicated with existing items so, add one.
                    matchingFlag = true;
                    newItemList[j].Quantity = currentItem.Quantity + newItemList[j].Quantity;
                    break; //you don't need to keep checking. waste of time.
                }
                //end of for loop, find existing Item index=i, does not match any new 
            }

            if (!matchingFlag) { //if you can't find matching, add existing item to the end of the new item list'
                newItemList.push(currentItem);
            }
        }

        return newItemList; //return the final item list at the end of the function

    }




    editUser(id: number) {
        this.dbops = DBOperation.update;
        this.SetControlsState(true);
        this.modalTitle = "Edit User";
        this.modalBtnTitle = "Update";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    deleteUser(id: number) {
        this.dbops = DBOperation.delete;
        this.SetControlsState(false);
        this.modalTitle = "Confirm to Delete?";
        this.modalBtnTitle = "Delete";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    onSubmit(formData: any) {
        this.msg = "";
   
        switch (this.dbops) {
            case DBOperation.create:
                this._userService.post(Global.BASE_USER_ENDPOINT, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully added.";
                            this.LoadUsers();
                        }
                        else
                        {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }
                        
                        this.modal.dismiss();
                    },
                    error => {
                      this.msg = error;
                    }
                );
                break;
            case DBOperation.update:
                this._userService.put(Global.BASE_USER_ENDPOINT, formData._value.Id, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully updated.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;
            case DBOperation.delete:
                this._userService.delete(Global.BASE_USER_ENDPOINT, formData._value.Id).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully deleted.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;

        }
    }

    SetControlsState(isEnable: boolean)
    {
        isEnable ? this.userFrm.enable() : this.userFrm.disable();
    }

    criteriaChange(value: string): void {
        if (value != '[object Event]')
            this.listFilter = value;
    }
}
