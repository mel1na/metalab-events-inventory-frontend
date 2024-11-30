let order = [];

const makeEntry = (id, name) => { // TODO this should make a table row
    let elem = document.getElementById('purchase-buttons').appendChild(document.createElement('div'));
    elem.classList.add('align-horizontal');
    let itemName = elem.appendChild(document.createElement('span'));
    let addBtn = elem.appendChild(document.createElement('button'));
    let itemQty = elem.appendChild(document.createElement('span'));
    let remBtn = elem.appendChild(document.createElement('button'));
    itemName.innerText = name;
    itemQty.innerText = '0';
    addBtn.innerText = '+';
    remBtn.innerText = '-';
    addBtn.addEventListener('click', () => {
        order[id]++;
        itemQty.innerText = toString(order[id]);
    });
    remBtn.addEventListener('click', () => {
        if (order[id] <= 0) return;
        order[id]--;
        itemQty.innerText = toString(order[id]);
    });
};





const addPurchase = (id) => {
    // TODO API call using
}

const createItem = (name, quantity, price) => fetch({
    url: "http://localhost:8080/api/items",
    method: "post",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    
    body: JSON.stringify({
      name: name,
      quantity: quantity,
      price: price
    })
}).then(r => r.json())
.then(r => { 
    //append item to local table
}).catch();
  
const fetchPurchases = () => fetch("http://localhost:8080/api/purchases").then(r => r.json()).then(r => {
    r.data.forEach(purchase => { //for each entry under data
        
    });
}).catch();

const fetchItems = () => fetch("http://localhost:8080/api/items").then(r => r.json()).then(r => {
    r.data.forEach(item => { //for each entry under data
        
    });
}).catch();



document.addEventListener("DOMContentLoaded", () => {
    fetchItems().then(() => fetchPurchases());

    makeEntry(1, 'meow');
    makeEntry(2, ':3');
    makeEntry(3, 'nyaa');
});
