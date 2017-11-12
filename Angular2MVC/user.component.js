"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var user_service_1 = require("../Service/user.service");
var forms_1 = require("@angular/forms");
var ng2_bs3_modal_1 = require("ng2-bs3-modal/ng2-bs3-modal");
var userItem_1 = require("../Model/userItem");
var shoppingCart_1 = require("../Model/shoppingCart");
var enum_1 = require("../Shared/enum");
var global_1 = require("../Shared/global");
var UserComponent = (function () {
    function UserComponent(fb, _userService) {
        this.fb = fb;
        this._userService = _userService;
        this.selectedUsers = [];
        this.indLoading = false;
        this.searchTitle = "Search User:";
    }
    UserComponent.prototype.ngOnInit = function () {
        this.userFrm = this.fb.group({
            Id: [''],
            FirstName: ['', forms_1.Validators.required],
            LastName: [''],
            Gender: ['', forms_1.Validators.required]
        });
        this.LoadUsers();
        this.loadShoppingCart();
    };
    UserComponent.prototype.checkboxChanged = function (userIdString) {
        var userId = parseInt(userIdString); //convert userId string to number. Parse Int at the beginning so it's ready to go later
        for (var i = 0; i < this.selectedUsers.length; i++) {
            if (this.selectedUsers[i].Id == userId) {
                this.selectedUsers.splice(i, 1); //this is how to remove element from array
                return;
            }
        }
        //find user using the userId. you have all users in the user array when you load it. 
        var currentSelectedUser = this.findUserById(userId); //this is the user you checked .create a new current selected user variable
        if (currentSelectedUser != null) {
            this.selectedUsers.push(currentSelectedUser);
        }
    };
    //if user is not in the selected user list. you have to go through the whole loop.
    UserComponent.prototype.findUserById = function (userId) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Id == userId) {
                return this.users[i];
            }
            return null; //in extreme scenario where user is deleted and can't be found'
        }
    };
    UserComponent.prototype.LoadShoppingCart = function () {
        var currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        localStorage.getItem("currentshoppingCart" + currentUser.Id);
        ;
    };
    UserComponent.prototype.LoadUsers = function () {
        var _this = this;
        this.indLoading = true;
        this._userService.get(global_1.Global.BASE_USER_ENDPOINT)
            .subscribe(function (users) { _this.users = users; _this.indLoading = false; }, function (error) { return _this.msg = error; });
    };
    UserComponent.prototype.addUser = function () {
        this.dbops = enum_1.DBOperation.create;
        this.SetControlsState(true);
        this.modalTitle = "Add New User";
        this.modalBtnTitle = "Add";
        this.userFrm.reset();
        this.modal.open();
    };
    UserComponent.prototype.PurchaseItems = function () {
        //we should store by user id because different user ids have different carts. user stored in session storage. First retrieve user ID. we want this to expire.
        var currentUser = JSON.parse(sessionStorage.getItem("currentUser")); //you hav to use JSON to pass current user storage string to get the real user
        var selectedUserItemList = this.convertUserListToUserItemList(this.selectedUsers);
        var ;
        this.currentshoppingCart = JSON.parse(localStorage.getItem("currentshoppingCart" + currentUser.Id)); //in local storage everything has a key. you're loading the shopping cart. we don't want this to expire
        //check to see if the user already has a shoppingcart stored in the local storage. if yes, then add to it. if not, then make one.
        if (this.currentshoppingCart == null) {
            this.currentshoppingCart = new shoppingCart_1.shoppingCart();
            this.currentshoppingCart.userId = currentUser.Id; //person who is doing the shopping
            this.currentshoppingCart.userItemList = selectedUserItemList; //users on the list of people checked
        }
        else {
            //if the current shopping cart exists, then you do this. add to the list. load shopping cart based on current userId. all you need to change is the list of items
            this.currentshoppingCart.userItemList = this.mergeItemList(this.currentshoppingCart.userItemList, selectedUserItemList);
        }
        localStorage.setItem("currentshoppingCart" + currentUser.Id, JSON.stringify(currentshoppingCart));
    };
    UserComponent.prototype.convertUserListToUserItemList = function (selectedUsers) {
        var userItemList = []; //data type is user Item ; declare empty user item with empty []
        for (var i = 0; i < selectedUsers.length; i++) {
            var tempUserItem = new userItem_1.userItem();
            tempUserItem.Quantity = 1;
            tempUserItem.user = selectedUsers[i];
            tempUserItem.Subtotal = 10.00 * tempUserItem.Quantity; //assume price is standard 10 dollars
            userItemList.push(tempUserItem); //add to user item list
        }
        return userItemList;
    };
    UserComponent.prototype.mergeItemList = function (existingItems, newItemList) {
        //do the work of comparing the two lists and then make changes to the current list
        //merging userItem Array
        var matchingFlag = false;
        for (var i = 0; i < existingItems.length; i++) {
            var currentItem = existingItems[i];
            matchingFlag = false; //every time you retrieve a new current item, reset matching flag to false to ensure you're seeing if the actual current item is already in the list
            for (var j = 0; j < newItemList.length; j++) {
                if (currentItem.user.Id == newItemList[j].user.Id) {
                    //if Ids match, the new items are duplicated with existing items so, add one.
                    matchingFlag = true;
                    newItemList[j].Quantity = currentItem.Quantity + newItemList[j].Quantity;
                    break; //you don't need to keep checking. waste of time.
                }
                //end of for loop, find existing Item index=i, does not match any new 
            }
            if (!matchingFlag) {
                newItemList.push(currentItem);
            }
        }
        return newItemList; //return the final item list at the end of the function
    };
    UserComponent.prototype.editUser = function (id) {
        this.dbops = enum_1.DBOperation.update;
        this.SetControlsState(true);
        this.modalTitle = "Edit User";
        this.modalBtnTitle = "Update";
        this.user = this.users.filter(function (x) { return x.Id == id; })[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    };
    UserComponent.prototype.deleteUser = function (id) {
        this.dbops = enum_1.DBOperation.delete;
        this.SetControlsState(false);
        this.modalTitle = "Confirm to Delete?";
        this.modalBtnTitle = "Delete";
        this.user = this.users.filter(function (x) { return x.Id == id; })[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    };
    UserComponent.prototype.onSubmit = function (formData) {
        var _this = this;
        this.msg = "";
        switch (this.dbops) {
            case enum_1.DBOperation.create:
                this._userService.post(global_1.Global.BASE_USER_ENDPOINT, formData._value).subscribe(function (data) {
                    if (data == 1) {
                        _this.msg = "Data successfully added.";
                        _this.LoadUsers();
                    }
                    else {
                        _this.msg = "There is some issue in saving records, please contact to system administrator!";
                    }
                    _this.modal.dismiss();
                }, function (error) {
                    _this.msg = error;
                });
                break;
            case enum_1.DBOperation.update:
                this._userService.put(global_1.Global.BASE_USER_ENDPOINT, formData._value.Id, formData._value).subscribe(function (data) {
                    if (data == 1) {
                        _this.msg = "Data successfully updated.";
                        _this.LoadUsers();
                    }
                    else {
                        _this.msg = "There is some issue in saving records, please contact to system administrator!";
                    }
                    _this.modal.dismiss();
                }, function (error) {
                    _this.msg = error;
                });
                break;
            case enum_1.DBOperation.delete:
                this._userService.delete(global_1.Global.BASE_USER_ENDPOINT, formData._value.Id).subscribe(function (data) {
                    if (data == 1) {
                        _this.msg = "Data successfully deleted.";
                        _this.LoadUsers();
                    }
                    else {
                        _this.msg = "There is some issue in saving records, please contact to system administrator!";
                    }
                    _this.modal.dismiss();
                }, function (error) {
                    _this.msg = error;
                });
                break;
        }
    };
    UserComponent.prototype.SetControlsState = function (isEnable) {
        isEnable ? this.userFrm.enable() : this.userFrm.disable();
    };
    UserComponent.prototype.criteriaChange = function (value) {
        if (value != '[object Event]')
            this.listFilter = value;
    };
    return UserComponent;
}());
__decorate([
    core_1.ViewChild('modal'),
    __metadata("design:type", ng2_bs3_modal_1.ModalComponent)
], UserComponent.prototype, "modal", void 0);
UserComponent = __decorate([
    core_1.Component({
        templateUrl: 'app/Components/user.component.html'
    }),
    __metadata("design:paramtypes", [forms_1.FormBuilder, user_service_1.UserService])
], UserComponent);
exports.UserComponent = UserComponent;
//# sourceMappingURL=user.component.js.map