import { 
    userIdRequest,
    xpRequest,
 } from "./queries.js";

let active_div = "div01";
let login = "ErikH";
let id = 3691;
let xp = 0;

// load default user data
window.addEventListener("load", async (event) => {
    document.getElementById('login').innerHTML = login;
    xp = await get_user_xp(id, 0);
});

// makes the navbar interactive
let buttons = document.querySelectorAll('.div-selection');
buttons.forEach((button) => {

    if (button.classList.contains('active')) {
        active_div = button.getAttribute('data-value');
    }

    button.addEventListener('click', (event) => {
        buttons.forEach((button) => {
            button.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        active_div = event.currentTarget.getAttribute('data-value');
        update_data();
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

async function get_user_xp(id, offset) {
    let path = "";
    console.log(active_div)

    //switch case aint working for some mfin reason
    switch (active_div) {
        case "div01":
            path = "/johvi/div-01/";
            break;
        case "go":
            path = "/johvi/piscine-go/";
            break;
        case "js":
            path = "/johvi/div-01/piscine-js/";
            break;
        case "rust":
            path = "/johvi/div-01/rust/";
            break;
    }
    let data = [];
    await graphql_query(xpRequest, {id: id, path: path, offset: offset})
        .then(response => {
            response.data.transaction.forEach((transaction) => {
                data.push(transaction.amount);
            });
        })
    xp = data.reduce((a, b) => a + b, 0);
    console.log(xp);
    console.log(data);
    console.log(path)
    if (data.length === 50) {
        return await get_user_xp(id, offset + 50);
    }
}

function update_data() {
    console.log("update_data");
}