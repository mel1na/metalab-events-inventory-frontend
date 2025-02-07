const $ = q => document.querySelector(q);
const isIndev = document.location.protocol === 'file:'
    || document.location.hostname === 'localhost'
    || document.location.hostname === '127.0.0.1';
const baseDomain = isIndev
    ? 'localhost:8080'
    : 'pos.metarave.jetzt';
const baseURL = isIndev
    ? `http://${baseDomain}`
    : `https://${baseDomain}`;

const foregroundColor = '#ffefef';

let ws;

let gitHash = '[indev]';
let rawAuth = undefined;
let auth = undefined;

let statisticsChart;
let statisticsLabels = [];
let statisticsData = [];

let order = [];
let orderElements = [];
let roundUp = false;

let items = []; // {id: int, name: string, price: int}
let categories = []; // [{id: int, name: string, items: [int}
let readers = [];// [{id: string, name: string, ...}

let currentInput = '';
let selection = -1;
let selectedReader = 0;

let pendingTransaction;
let lastKnownTransactionStatus;


const GET = async (path) => fetch(`${baseURL}${path}`, {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': auth
    }
}).then(r => r.json()).catch(console.log);

const POST = async (path, data) => fetch(`${baseURL}${path}`, {
    method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify(data)
}).then(r => r.json()).catch(console.log);

const DELETE = async (path, data) => fetch(`${baseURL}${path}`, {
    method: 'delete',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify(data)
}).then(r => r.json()).catch(console.log);

const onLogin = async () => {
    connectWs();

    await fetchItems();
    await fetchCategories();
    await fetchReaders();
    loadCategoryOverview();
}

const login = () => {
    let token = $('#auth-input').value;
    if (!token.startsWith('Bearer '))
        token = 'Bearer ' + token;
    checkAuth(token).then(async ok => {
        if (ok) {
            auth = token;
            rawAuth = token.split(' ', 2)[1];
            localStorage.setItem('auth_token', rawAuth);
            await onLogin();
            $('#auth-prompt').close();
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
    let subtotal = order.reduce((c, v, i) => c + v.amount * (v.id === 0 ? v.price : items[v.id].price), 0);
    let tip = roundUp && subtotal % 100
        ? 100 - (subtotal % 100)
        : 0;
    let total = subtotal + tip;
    $('#subtotal').innerText = `Subtotal: ${total / 100}€`;

    orderElements = [];
    for (let i = 0; i < order.length; i++) {
        let item = order[i];
        let elem = document.createElement('div');
        let itemName  = elem.appendChild(document.createElement('span'));
        let spacer    = elem.appendChild(document.createElement('div'));
        let itemPrice = elem.appendChild(document.createElement('span'));

        elem.classList.add('align-horizontal');
        if (i == selection)
            elem.classList.add('selected');

        itemName.innerText = item.id === 0 ? 'POS' : items[item.id].name;
        console.log(item.amount);
        if (item.amount > 1)
            itemName.innerText += ` (${item.amount})`
        itemPrice.innerText = `${((item.id === 0 ? item.price : items[item.id].price) * item.amount) / 100}€`;

        spacer.classList.add('spacer');
        spacer.setAttribute('flex', 'true');

        elem.addEventListener('click', () => {
            elem.classList.add('selected');
            if (selection !== -1)
                orderElements[selection].classList.remove('selected');
            selection = i;
        });
        orderElements.push(elem);
    }
    $('#item-list').replaceChildren(...orderElements);
}

const updateInputDisplay = () => {
    $('#input').innerText = `Input: ${currentInput}`
}

const roundTip = () => {
    roundUp = !roundUp;

    if (roundUp)
        $('#round-indicator').classList.remove('d-none');
    else $('#round-indicator').classList.add('d-none');

    updateOrderDisplay();
}

const input = (v) => {
    currentInput += v;
    updateInputDisplay();
}

const pos = () => {
    if (!currentInput) {
        orderElements[selection].classList.remove('selected');
        selection = -1;
        return;
    }

    if (order.length > 0 && (order[order.length - 1].amount === 1 || selection !== -1) && !currentInput.includes('.'))
        order[selection !== -1 ? selection : order.length - 1].amount = parseInt(currentInput);
    else {
        let parts = currentInput.split('.', 2)
        if (parts.length > 1) {
            parts[1] = parts[1].replace('.', '').substring(0, 2);
            while (parts[1].length < 2)
                parts[1] += '0';
        } else parts[0] += '00';
        order.push({
            id: 0,
            amount: 1,
            price: parseInt(parts.join(''))
        });
    }

    currentInput = '';
    updateInputDisplay();
    updateOrderDisplay();
}

const storno = () => {
    if (currentInput) {
        currentInput = '';
        updateInputDisplay();
    } else if (order) {
        if (selection < 0)
            order.pop();
        else {
            order.splice(selection, 1);
            selection = -1;
        }
        updateOrderDisplay();
    }
}

const addToOrder = (id) => {
    order.push({
        id: id,
        amount: 1
    });
    updateOrderDisplay();
}

const clearInput = () => {
    currentInput = '';
    order = [];
    roundUp = false;
    updateInputDisplay();
    updateOrderDisplay();
    loadCategoryOverview();
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
    for (let i = 0, ch; i < str.length; i++) {
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
    elem.addEventListener('click', () => addToOrder(id));
    return elem;
}

const addPurchase = async (paymentType) => {
    let subtotal = order.reduce((c, v, i) => c + v.amount * (v.id === 0 ? v.price : items[v.id].price), 0);
    let tip = roundUp && subtotal % 100
        ? 100 - (subtotal % 100)
        : undefined;
    let items = [];
    order.forEach(item => {
        if (item.id === 0)
            tip += item.amount * item.price;
        else items.push({ id: item.id, quantity: item.amount })
    });
    if (items.length === 0 && tip <= 0)
        return;

    let promise = POST('/api/purchases', {
        items: items,
        tip: tip,
        payment_type: paymentType,
        reader_id: readers[selectedReader]?.id,
    });

    if (paymentType === 'card') {
        promise = promise.then(r => pendingTransaction = r.id);
        $('#transaction-processing').showModal();
    } else clearInput();

    return promise;
}

const fetchReaders = async () => GET('/api/payments/readers')
.then(r => {
    readers = r ? [null, ...r.data] : [null];

    let options = [];

    let def = document.createElement('option');
    def.setAttribute('value', '0');
    def.innerText = 'None';
    options.push(def);

    readers.forEach((reader, i) => {
        if (i == 0) return; // default reader
        let opt = document.createElement('option');
        opt.setAttribute('value', `${i}`);
        opt.innerText = reader.name;
        options.push(opt);
    });

    $('#sumup-reader-select').replaceChildren(...options);
    $('#sumup-reader-select').value = '0';
    selectReader();
});

const fetchItems = async () => GET('/api/items')
.then(r => {
    items = [];
    r.data.forEach(item => items[item.id] = item);
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

const selectReader = () => {
    selectedReader = parseInt($('#sumup-reader-select').value);
    let active = selectedReader !== 0;
    $('#transaction-cancel-btn').disabled = !active;
    $('#purchase-card').disabled = !active;
}

const connectWs = () => {
    ws = new WebSocket(baseURL + '/api/payments');

    ws.addEventListener('message', e => {
        let data = JSON.parse(e.data);

        if (!pendingTransaction) {
            lastKnownTransactionStatus = data;
            return;
        }

        if (pendingTransaction !== data.client_transaction_id)
            return;

        switch (data.transaction_status) {
            case 'cancelled', 'failed':
                $('#transaction-failed').showModal();
                $('#transaction-processing').close();
                break;
            case 'successful':
                clearInput();
                $('#transaction-processing').close();
                break;
            case 'pending':
            default:
                return;
        }
    });

    ws.addEventListener('open', e => {
        $('#ws-disconnect').close();
        ws.send(rawAuth);
    });

    ws.addEventListener('error', e => {
        ws = undefined;
        $('#ws-disconnect').showModal();
        setTimeout(connectWs, 1000);
    });

    ws.addEventListener('close', e => {
        ws = undefined;
        $('#ws-disconnect').showModal();
        setTimeout(connectWs, 1000);
    });
}

const cancelTransaction = () => {
    DELETE('/api/payments/terminate', {
        id: readers[selectedReader]?.id,
    }).then(() => {
        $('#transaction-processing').close();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    rawAuth = localStorage.getItem('auth_token');
    auth = 'Bearer ' + rawAuth;
    checkAuth(auth).then(ok => {
        if (!ok) {
            rawAuth = auth = undefined;
            localStorage.removeItem('auth_token');
            $('#auth-prompt').showModal();
        } else onLogin();
    });

    $('#version-display').innerText = `Version: ${gitHash}`;
});
