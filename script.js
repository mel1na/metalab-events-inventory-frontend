const baseURL = 'http://localhost:8080';

let qtyElements = [];
let prices = [];
let tipID = 0;
let order = [];

const updateTotals = () => {
    if (!order[tipID]) order[tipID] = 0;
    let total = order.reduce((c, v, i) => c + v * prices[i], 0);
    let subtotal = total - order[tipID] * prices[tipID];
    document.getElementById('subtotal').innerText = `Subtotal: ${subtotal}€`;
    document.getElementById('total').innerText = `Total: ${total}€`;
};

const makePurchaseInput = (id, name) => {
    let elem = document.createElement('tr');
    elem.classList.add('purchase-input');
    let itemName = elem.appendChild(document.createElement('td')).appendChild(document.createElement('span'));
    let addBtn   = elem.appendChild(document.createElement('td')).appendChild(document.createElement('button'));
    let itemQty  = elem.appendChild(document.createElement('td')).appendChild(document.createElement('span'));
    let remBtn   = elem.appendChild(document.createElement('td')).appendChild(document.createElement('button'));
    let set0Btn  = elem.appendChild(document.createElement('td')).appendChild(document.createElement('button'));
    itemName.innerText = name;
    itemQty.innerText = '0';
    addBtn.innerText = '+';
    remBtn.innerText = '-';
    set0Btn.innerText = 'X';
    addBtn.addEventListener('click', () => {
        if (!order[id]) order[id] = 0;
        order[id]++;
        itemQty.innerText = order[id];
        updateTotals();
    });
    remBtn.addEventListener('click', () => {
        if (!order[id]) order[id] = 0;
        if (order[id] <= 0) return;
        order[id]--;
        itemQty.innerText = order[id];
        updateTotals();
    });
    set0Btn.addEventListener('click', () => {
        order[id] = 0;
        itemQty.innerText = order[id];
        updateTotals();
    });
    qtyElements.push(itemQty);
    return elem;
};

const addPurchase = async (paymentType) => {
    let items = [];
    for (let i = 0; i < order.length; i++)
        if (order[i])
            items.push({ 'id': i, 'quantity': order[i] });
    
    order = [];
    qtyElements.forEach(e => e.innerText = '0');

    return fetch(`${baseURL}`, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'items': items,
            'payment_type': paymentType
        })
    }).then(r => r.json()).catch();
}

// frontend doesn't need to support this
// const createItem = async (name, quantity, price) => fetch(`${baseURL}/api/items`, {
//     method: 'post',
//     headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json'
//     },
    
//     body: JSON.stringify({
//       name: name,
//       quantity: quantity,
//       price: price
//     })
// }).then(r => r.json())
// .then(r => { 
//     //append item to local table
// }).catch();
  
const fetchPurchases = async () => fetch(`${baseURL}/api/purchases`).then(r => r.json()).then(r => {
    r.data.forEach(purchase => { //for each entry under data
        
    });
}).catch();

const fetchItems = async () => fetch(`${baseURL}/api/items`)
.then(r => r.json())
.then(r => {
    let items = [];
    qtyElements = [];
    prices = [];
    r.data.forEach(item => {
        prices[item.id] = item.price;
        if (item.name !== 'Tip')
            items.push(makePurchaseInput(item.id, `${item.name} ${item.price}€`))
        else {
            tipID = item.id;
            document.getElementById('tip-inc5').addEventListener('click', () => {
                if (!order[tipID]) order[tipID] = 0;
                order[tipID] += 5;
                document.getElementById('tip-qty').innerText = order[tipID];
                updateTotals();
            });
            document.getElementById('tip-inc').addEventListener('click', () => {
                if (!order[tipID]) order[tipID] = 0;
                order[tipID]++;
                document.getElementById('tip-qty').innerText = order[tipID];
                updateTotals();
            });
            document.getElementById('tip-dec').addEventListener('click', () => {
                if (!order[tipID]) order[tipID] = 0;
                if (order[tipID] <= 0) return;
                order[tipID]--;
                document.getElementById('tip-qty').innerText = order[tipID];
                updateTotals();
            });
            document.getElementById('tip-set0').addEventListener('click', () => {
                order[tipID] = 0;
                document.getElementById('tip-qty').innerText = order[tipID];
                updateTotals();
            });
        }
    });
    document.querySelector('#purchase-inputs>table>tbody').replaceChildren(items);
}).catch();



document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
    fetchPurchases();

    // prices = [ 1, 2, 3, 5, 5, 5, 5, 5, 5, 5, 50, 9, 7 ];

    // tipID = 0;
    // document.getElementById('tip-inc5').addEventListener('click', () => {
    //     if (!order[tipID]) order[tipID] = 0;
    //     order[tipID] += 5;
    //     document.getElementById('tip-qty').innerText = order[tipID];
    //     updateTotals();
    // });
    // document.getElementById('tip-inc').addEventListener('click', () => {
    //     if (!order[tipID]) order[tipID] = 0;
    //     order[tipID]++;
    //     document.getElementById('tip-qty').innerText = order[tipID];
    //     updateTotals();
    // });
    // document.getElementById('tip-dec').addEventListener('click', () => {
    //     if (!order[tipID]) order[tipID] = 0;
    //     if (order[tipID] <= 0) return;
    //     order[tipID]--;
    //     document.getElementById('tip-qty').innerText = order[tipID];
    //     updateTotals();
    // });
    // document.getElementById('tip-set0').addEventListener('click', () => {
    //     order[tipID] = 0;
    //     document.getElementById('tip-qty').innerText = order[tipID];
    //     updateTotals();
    // });

    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(1, 'meow'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(2, ':3'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(3, 'nyaa'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(4, 'nyaa 1'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(5, 'nyaa 2'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(6, 'nyaa 3'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(7, 'nyaa 4'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(8, 'nyaa 5'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(9, 'nyaa 6'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(10, 'nyaa 7'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(11, 'nyaa 8'));
    // document.querySelector('#purchase-inputs>table>tbody').appendChild(makePurchaseInput(12, 'nyaa 9'));
});
