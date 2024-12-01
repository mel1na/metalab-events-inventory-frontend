const baseURL = 'http://localhost:8080';
const foregroundColor = '#ffefef';

let statisticsChart;
let statisticsLabels = [];
let statisticsData = [];

let tipInputsPending = 0;

let qtyElements = [];
let prices = [];
let order = [];

const updateTotals = () => {
    let tip = parseFloat(document.getElementById('tip-qty').value) || 0;
    let subtotal = Math.round((order.reduce((c, v, i) => c + v * prices[i], 0)) * 100) / 100;
    let total = Math.round((subtotal + tip) * 100) / 100;
    document.getElementById('subtotal').innerText = `Subtotal: ${subtotal}€`;
    document.getElementById('total').innerText = `Total: ${total}€`;
};

const roundTip = () => {
    let subtotal = order.reduce((c, v, i) => c + v * prices[i], 0);
    let tip = Math.round((Math.ceil(subtotal) - subtotal) * 100) / 100;
    document.getElementById('tip-qty').value = tip || '';
    updateTotals();
}

const makePurchaseInput = (id, name) => {
    let elem = document.createElement('tr');
    elem.classList.add('purchase-input');
    let itemName = elem.appendChild(document.createElement('td')).appendChild(document.createElement('span'));
    let remBtn   = elem.appendChild(document.createElement('td')).appendChild(document.createElement('button'));
    let itemQty  = elem.appendChild(document.createElement('td')).appendChild(document.createElement('span'));
    let addBtn   = elem.appendChild(document.createElement('td')).appendChild(document.createElement('button'));
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
            items.push({ id: i, quantity: order[i] });
    
    order = [];
    qtyElements.forEach(e => e.innerText = '0');
    updateTotals();

    let promise = fetch(`${baseURL}`, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: items,
            tip: parseFloat(document.getElementById('tip-qty').value) || undefined,
            payment_type: paymentType
        })
    }).then(r => r.json()).catch();
    setTimeout(fetchPurchases, 200);
    return promise;
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
    // the way this api works surely won't lead to issues later down the line (foreshadowing)
    statisticsData.length = 0;
    statisticsLabels.length = 0;
    r.data.forEach(purchase =>
        purchase.items.forEach(item => {
            if (!statisticsLabels[item.id]) statisticsLabels[item.id] = item.name;
            if (!statisticsData[item.id]) statisticsData[item.id] = item.quantity;
            else statisticsData[item.id] += item.quantity;
        })
    );
    statisticsChart.update();
}).catch();

const fetchItems = async () => fetch(`${baseURL}/api/items`)
.then(r => r.json())
.then(r => {
    let items = [];
    qtyElements = [];
    prices = [];
    r.data.forEach(item => {
        prices[item.id] = item.price;
        items.push(makePurchaseInput(item.id, `${item.name} ${item.price}€`));
    });
    document.querySelector('#purchase-inputs>table>tbody').replaceChildren(...items);
}).catch();

document.addEventListener('DOMContentLoaded', () => {
    Chart.register(ChartDataLabels);
    Chart.defaults.font.size = 24;
    statisticsChart = new Chart(
        document.getElementById('purchase-statistics-canvas'),
        {
            type: 'bar',
            options: {
                animation: true,
                aspectRatio: 3,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            display: false
                        }
                    },
                    x: {
                        ticks: {
                            color: foregroundColor
                        }
                    }
                },
                layout: {
                    padding: 15
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'bottom',
                        labels: {
                            color: foregroundColor,
                            font: {
                                size: 24
                            }
                        }
                    },
                    tooltip: {
                        enabled: false
                    },
                    datalabels: {
                        formatter: (value, ctx) => value,
                        color: foregroundColor,
                        font: {
                            size: 24
                        }
                    }
                }
            },
            data: {
                labels: statisticsLabels,
                datasets: [
                    {
                        data: statisticsData,
                        backgroundColor: [ '#BF307A', '#309FBF', '#30BF33', '#30BF88', '#7030BF', '#BF3098', '#BF5230', '#309FBF', '#BF3095', '#30BFAD', '#3D30BF', '#4BBF30', '#BF3041', '#30BF69', '#95BF30', '#BF4E30', '#30B0BF', '#BF30B7', '#303DBF', '#30BF98' ],
                        borderColor: foregroundColor
                    }
                ]
            }
        }
    );

    document.getElementById('tip-qty').value = '';
    document.getElementById('tip-qty').addEventListener('input', () => {
        tipInputsPending++;
        setTimeout(() => {
            tipInputsPending--;
            if (tipInputsPending == 0)
                updateTotals();
        }, 200);
    });

    document.getElementById('tip-round').addEventListener('click', () => {
        if (!order[tipID]) order[tipID] = 0;
        order[tipID] += 5;
        document.getElementById('tip-qty').innerText = order[tipID];
        updateTotals();
    });

    fetchItems();
    fetchPurchases();








    // prices = [ 1, 2, 3, 5, 5, 5, 5, 5, 5, 5, 50, 0.1, 1 ];

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

    // [ 'meow', ':3', 'nyaa', 'nyaa 1', 'nyaa 2', 'nyaa 3', 'nyaa 4', 'nyaa 5', 'nyaa 6', 'nyaa 7', 'nyaa 8', 'nyaa 9' ].forEach(l => statisticsLabels.push(l));
    // [ 2, 3, 5, 5, 5, 5, 5, 5, 5, 50, 9, 7 ].forEach(v => statisticsData.push(v));
    // statisticsChart.update();
});
