import { 
    userIdRequest,
    piscineXpRequest,
    divTaskIdRequest,
    xpAmountRequest,
    auditXpRequest,
} from "./queries.js";

let active_div = "div01";
let login = "ErikH";
let id = 3691;
let xp = 0;
let level = 0;
let transactions = 0;
let percentage = 0;
let auditUp = 0;
let auditDown = 0;
let auditRatio = 0;


let circle = document.querySelector(".circle");
async function update_data() {
    console.log("updating data")
    await get_user_xp(0)
    level = get_user_level()
    percentage = next_level_percentage()
    circle.setAttribute("stroke-dasharray", `${percentage}, 100`);
    document.getElementById('login').innerHTML = login;
    document.getElementById('xp').innerHTML = Math.round(xp / 1000) + "kB";
    document.getElementById('level').innerHTML = level;
    document.getElementById('transactions').innerHTML = transactions;
    document.getElementById('percentage').innerHTML = percentage + "%";
}

// load default user data
window.addEventListener("load", async (event) => {
    await update_data()
    await get_audit_ratio(0)
});

// makes the navbar interactive
let buttons = document.querySelectorAll('.div-selection');
buttons.forEach((button) => {

    if (button.classList.contains('active')) {
        active_div = button.getAttribute('data-value');
    }

    button.addEventListener('click', async (event) => {
        buttons.forEach((button) => {
            button.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        active_div = event.currentTarget.getAttribute('data-value');
        await update_data();
    });

});

// user search functionality
let search = document.getElementById('search');
search.addEventListener('keydown', async (event) => {
    if (event.key === "Enter") {
        login = search.value;
        document.getElementById('login').innerHTML = login;
        id = await get_user_id(login);
        search.value = "";
        await update_data();
        await get_audit_ratio(0)
    }
});

// graphql api fetch
async function graphql_query(query, variables) {
    return fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            query: query,
            variables
        })
    }).then(response => response.json());
}

async function get_user_id(login) {
    return await graphql_query(userIdRequest, {login: login})
        .then(response => {return response.data.user[0].id});
}

async function get_user_xp(offset) {
    let path = "";
    let piscine = true

    if (offset === 0) {
        xp = 0
    }

    switch (active_div) {
        case "div01":
            path = "/johvi/div-01/";
            piscine = false
            break;
        case "go":
            path = "/johvi/piscine-go/";
            break;
        case "js":
            path = "/johvi/div-01/piscine-js";
            break;
        case "rust":
            path = "/johvi/div-01/rust/";
            break;
        default:
            console.log("oopsiewoopsie")
    }

    let data = [];
    if (piscine) {
        await graphql_query(piscineXpRequest, {id: id, path: path, offset: offset})
        .then(response => {
            response.data.transaction.forEach((transaction) => {
                data.push(transaction.amount);
            });
        })
    } else {
        let objects = []
        await graphql_query(divTaskIdRequest, {id: id})
        .then(response => {objects = response})
        // first element is id 26 (piscine-go) that returns undefined so i shift the array
        objects.data.progress.shift()
        for (let obj of objects.data.progress) {
            data.push(await get_object_xp(obj.objectId))
        }
    }

    xp += data.reduce((a, b) => a + b, 0);
    if (data.length === 50) {
        return await get_user_xp(offset + 50);
    } else {
        //updates the transactions counter
        transactions = data.length + offset
    }
}

// gets a tasks object id and returns xp amount of given task
// i know its wildly inefficient but cba making it faster since this API is a pain in the ass and whoever designed it should be ashamed
async function get_object_xp(objectId) {
    return await graphql_query(xpAmountRequest, {objectId: objectId, userId: id})
    .then(response => {
        let res = response.data.transaction[0].amount

        // some objectIds return multiple objects with differing xp amounts so i take the highest one
        // found out by trial and error that the highest xp amount is always right
        if (response.data.transaction.length > 1) {
            for (let transaction of response.data.transaction) {
                if (transaction.amount > res) {
                    res = transaction.amount
                }
            }
        }
        return res
    })
}

// calculates the users level
// thanks to olari for the formula 
function get_user_level() {
    let lvl = 0
    while (levelNeededXP(++lvl) < xp) {}

    return lvl-1
}

function levelNeededXP(lvl) {
    return Math.round(lvl * (176 + 3 * lvl * (47 + 11 * lvl)))
}

// calculate percentage to next level
function next_level_percentage() {
    return Math.round((xp - levelNeededXP(level)) / (levelNeededXP(level + 1) - levelNeededXP(level)) * 100)
}

// calculates the users audit ratio
async function get_audit_ratio(offset) {
    let upData = []
    let downData = []
    await graphql_query(auditXpRequest, {userId: id, offset: offset})
    .then(response => {
        response.data.transaction.forEach((transaction) => {
            if (transaction.type === 'up') {
                upData.push(transaction.amount);
            } else {
                downData.push(transaction.amount);
            }
        });
    })

    auditUp += upData.reduce((a, b) => a + b, 0);
    auditDown += downData.reduce((a, b) => a + b, 0);

    if (upData.length + downData.length === 50) {
        return await get_audit_ratio(offset + 50);
    } else {
        auditRatio = Math.round(auditUp / auditDown * 10) / 10
        auditUp = Math.round(auditUp / 1000)
        auditDown = Math.round(auditDown / 1000)
        update_audit_graph()
    }
}

function update_audit_graph() {
    let auditRatioPercentage = 0
    let up = document.querySelector("#auditUp");
    let down = document.querySelector("#auditDown");

    if (auditRatio > 1) {
        auditRatioPercentage = Math.round(auditDown / auditUp * 100)
        up.setAttribute("width", `100`);
        down.setAttribute("width", `${auditRatioPercentage}`);
    } else {
        auditRatioPercentage = Math.round(auditUp / auditDown * 100)
        up.setAttribute("width", `${auditRatioPercentage}`);
        down.setAttribute("width", `100`);
    }

    document.getElementById("up").innerHTML = auditUp + "kB";
    document.getElementById("down").innerHTML = auditDown + "kB";
    document.getElementById("ratio").innerHTML = auditRatio;

}