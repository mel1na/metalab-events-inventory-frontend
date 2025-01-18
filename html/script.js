const $ = q => document.querySelector(q);
const baseURL = document.location.protocol === 'file:' || document.location.hostname === 'localhost' || document.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://metalab-pos.gupper.systems';
const foregroundColor = '#ffefef';

let auth = undefined;

let statisticsChart;
let statisticsLabels = [];
let statisticsData = [];

let tipInputsPending = 0;

let qtyElements = [];
let prices = [];
let order = [];

const GET = async (path) => fetch(`${baseURL}${path}`, {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': auth
    }
}).then(r => r.json()).catch();

const POST = async (path, data) => fetch(`${baseURL}${path}`, {
    method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify(data)
}).then(r => r.json()).catch();

const onLogin = () => {
    fetchItems();
    fetchPurchases();
}

const login = () => {
    let token = $('#auth-input').value;
    if (!token.startsWith('Bearer '))
        token = 'Bearer ' + token;
    checkAuth(token).then(ok => {
        if (ok) {
            auth = token;
            localStorage.setItem('auth_token', token);
            $('#auth-prompt').close();
            onLogin();
        } else
            $('#auth-input').classList.add('error');
    });
}

const checkAuth = async (token) => {
    return token === null ? false : fetch(`${baseURL}/api/token/validate`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': token
        }
    }).then(r => r.ok).catch(console.log);
}

const updateTotals = () => {
    let tip = parseFloat($('#tip-qty').value) || 0;
    let subtotal = Math.round((order.reduce((c, v, i) => c + v * prices[i], 0)) * 100) / 100;
    let total = Math.round((subtotal + tip) * 100) / 100;
    $('#subtotal').innerText = `Subtotal: ${subtotal}€`;
    $('#total').innerText = `Total: ${total}€`;
};

const roundTip = () => {
    let subtotal = order.reduce((c, v, i) => c + v * prices[i], 0);
    let tip = Math.round((Math.ceil(subtotal) - subtotal) * 100) / 100;
    $('#tip-qty').value = tip || '';
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
    let tip = parseFloat($('#tip-qty').value) || undefined;
    let items = [];
    for (let i = 0; i < order.length; i++)
        if (order[i])
            items.push({ id: i, quantity: order[i] });
    if (!Array.isArray(items) || !items.length) { return; }
    
    order = [];
    qtyElements.forEach(e => e.innerText = '0');
    $('#tip-qty').value = '';
    updateTotals();

    let promise = POST('/api/purchases', {
        items: items,
        tip: tip,
        payment_type: paymentType
    });
    setTimeout(fetchPurchases, 200);
    return promise;
}

const fetchPurchases = async () => GET('/api/purchases')
.then(r => {
    // the way this api works surely won't lead to issues later down the line (foreshadowing)
    statisticsData.length = 0;
    statisticsLabels.length = 0;
    r.data.forEach(purchase => {
        if (purchase?.items)
            purchase.items.forEach(item => {
                if (!statisticsLabels[item.id]) statisticsLabels[item.id] = item.name;
                if (!statisticsData[item.id]) statisticsData[item.id] = item.quantity;
                else statisticsData[item.id] += item.quantity;
            });
    });
    statisticsChart.update();
});

const fetchItems = async () => GET('/api/items')
.then(r => {
    let items = [];
    qtyElements = [];
    prices = [];
    r.data.forEach(item => {
        prices[item.id] = item.price;
        items.push(makePurchaseInput(item.id, `${item.name} ${item.price}€`));
    });
    $('#purchase-inputs>table>tbody').replaceChildren(...items);
});

document.addEventListener('DOMContentLoaded', async () => {
    let token = localStorage.getItem('auth_token');
    checkAuth(token).then(ok => {
        if (!ok) {
            localStorage.removeItem('auth_token');
            $('#auth-prompt').showModal();
        } else onLogin();
    })


    Chart.register(ChartDataLabels);
    Chart.defaults.font.size = 24;
    statisticsChart = new Chart(
        $('#purchase-statistics-canvas'),
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

    $('#tip-qty').value = '';
    $('#tip-qty').addEventListener('input', () => {
        tipInputsPending++;
        setTimeout(() => {
            tipInputsPending--;
            if (tipInputsPending == 0)
                updateTotals();
        }, 200);
    });

    $('#tip-round').addEventListener('click', () => {
        if (!order[tipID]) order[tipID] = 0;
        order[tipID] += 5;
        $('#tip-qty').innerText = order[tipID];
        updateTotals();
    });
});
