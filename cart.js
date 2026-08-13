
const items = document.getElementById("items");
const plusButtons = document.getElementsByClassName("plus");
const minusButtons = document.getElementsByClassName("minus");
const removeButtons = document.getElementsByClassName("remove");




function update() 
{

    const rows = items.getElementsByClassName("item");

    let subtotal = 0;
    let count = 0;

    for (let i = 0; i < rows.length; i++) 
    {
        const qty = Number(rows[i].querySelector(".qty-val").textContent);
        const price = Number(rows[i].querySelector(".price-val").textContent);

        subtotal += (qty * price);
        count += qty;
    }

    let shipping = 0;

    if (rows.length > 0) 
    {
        shipping = 5;
    }

    document.getElementById("subtotal").textContent = "$" + subtotal.toFixed(2);
    document.getElementById("shipping").textContent = "$" + shipping.toFixed(2);
    document.getElementById("total").textContent = "$" + (subtotal + shipping).toFixed(2);
    document.getElementById("badge").textContent = count;
    document.getElementById("cartTitle").textContent = "Your Shopping Cart (" + rows.length + " Items)";
}

for (let i = 0; i < plusButtons.length; i++) 
{
    plusButtons[i].addEventListener("click", function () 
    {
        const item = this.parentElement;
        const qty = item.querySelector(".qty-val");

        qty.textContent = Number(qty.textContent) + 1;

        update();
    });
}

for (let i = 0; i < minusButtons.length; i++) 
{
    minusButtons[i].addEventListener("click", function () 
    {
        const item = this.parentElement;
        const qty = item.querySelector(".qty-val");

        let value = Number(qty.textContent);

        if (value > 1) 
        {
            qty.textContent = value - 1;
        }

        update();
    });
}

for (let i = 0; i < removeButtons.length; i++) 
{
    removeButtons[i].addEventListener("click", function () 
    {
        const item = this.parentElement;

        item.remove();

        update();
    });
}

update();