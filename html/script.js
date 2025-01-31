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

let prices = [];
let order = [];
let roundUp = false;

let items = []; // {id: int, name: string, price: int}
let categories = []; // [{id: int, name: string, items: [int}

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

const onLogin = async () => {
    await fetchItems();
    await fetchCategories();
    fetchPurchases();
    loadCategoryOverview();
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

const updateOrderDisplay = () => {
    let subtotal = order.reduce((c, v, i) => c + v * prices[i], 0);
    let tip = roundUp
        ? 100 - (subtotal % 100)
        : 0;
    let total = subtotal + tip;
    $('#subtotal').innerText = `Subtotal: ${total / 100}€`;
    //$('#total').innerText = `Total: ${total}€`;
}

const roundTip = () => {
    roundUp = !roundUp;

    if (roundUp)
        $('#round-indicator').classList.remove('d-none');
    else $('#round-indicator').classList.add('d-none');

    updateOrderDisplay();
}

const input = (v) => {

}

const pos = () => {

}

const storno = () => {

}

const clear = () => {

}

const loadCategoryOverview = () => {
    if (categories.length == 0) {
        loadItemOverview();
        return;
    }
    let tiles = [];
    categories.forEach(category => tiles.push(makeCategoryTile(category.id, category.name, category.price)));
    $('#purchase-select>div').replaceChildren(...tiles);
}

const loadItemOverview = () => {
    let tiles = [];
    items.forEach(item => tiles.push(makeItemTile(item.id, item.name, item.price)));
    $('#purchase-select>div').replaceChildren(...tiles);
}

const openCategory = (id) => {
    let tiles = [makeBackTile()];
    categories[id].items.forEach(itemId => {
        let item = items[itemId];
        tiles.push(makeItemTile(item.id, item.name, item.price));
    });
    $('#purchase-select>div').replaceChildren(...tiles);
}

// maybe a bit overkill, but eeeeh
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

const colors = [ 'bg-red', 'bg-blue', 'bg-green', 'bg-orange' ];
const getColor = (str, seed = 0) => {
    return colors[cyrb53(str, seed) & 0b11];
}

const makeCategoryTile = (id, name) => {
    let elem = document.createElement('div');
    let itemName  = elem.appendChild(document.createElement('span'));
    itemName.innerText = name;
    elem.classList.add(getColor(name, id));
    elem.addEventListener('click', () => openCategory(id));
    return elem;
}

const makeBackTile = () => {
    let elem = document.createElement('div');
    let name  = elem.appendChild(document.createElement('span'));
    name.innerText = 'Back';
    // elem.classList.add('');
    elem.addEventListener('click', loadCategoryOverview);
    return elem;
}

const makeItemTile = (id, name, price) => {
    let elem = document.createElement('div');
    let itemName  = elem.appendChild(document.createElement('span'));
    let spacer    = elem.appendChild(document.createElement('div'));
    let itemPrice = elem.appendChild(document.createElement('span'));
    itemName.innerText = name;
    itemPrice.innerText = `${price / 100}€`;
    elem.classList.add(getColor(name, id));
    elem.addEventListener('click', () => {
        if (!order[id]) order[id] = 0;
        order[id]++;
        updateOrderDisplay();
    });
    return elem;
}

const addPurchase = async (paymentType) => {
    let subtotal = order.reduce((c, v, i) => c + v * prices[i], 0);
    let tip = roundUp
        ? Math.round((Math.ceil(subtotal) - subtotal) * 100) / 100
        : undefined;
    let items = [];
    for (let i = 0; i < order.length; i++)
        if (order[i])
            items.push({ id: i, quantity: order[i] });
    if (!Array.isArray(items) || !items.length) { return; }
    
    order = [];
    roundTip = false;
    updateOrderDisplay();

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
    prices = [];
    r.data.forEach(item => {
        prices[item.id] = item.price;
        items[item.id] = item;
    });
});

const fetchCategories = async () => GET('/api/groups')
.then(r => {
    r.data.forEach(category => {
        categories[category.id] = {
            id: category.id,
            name: category.name,
            items: category.items.map(i => i.id)
        };
    });
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

    // $('#tip-qty').value = '';
    // $('#tip-qty').addEventListener('input', () => {
    //     tipInputsPending++;
    //     setTimeout(() => {
    //         tipInputsPending--;
    //         if (tipInputsPending == 0)
    //             updateOrderDisplay();
    //     }, 200);
    // });

    // $('#tip-round').addEventListener('click', () => {
    //     if (!order[tipID]) order[tipID] = 0;
    //     order[tipID] += 5;
    //     $('#tip-qty').innerText = order[tipID];
    //     updateOrderDisplay();
    // });
});
