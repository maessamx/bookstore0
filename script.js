import {saveBookToCart} from "./main2.js";
const buttons = document.querySelectorAll(".container .book .co .words .add-btn");

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const id = button.dataset.id;

        let mm =saveBookToCart(id);
        if(mm){
            alert("added");
        }else{
            alert("isadded before");
        }
    });
});