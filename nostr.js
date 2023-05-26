// CHANGE THIS TO YOUR OWN PUBLIC KEY (HEX FORMAT)
const pubkey = "480ec1a7516406090dc042ddf67780ef30f26f3a864e83b417c053a5a611c838"

async function nostrGetUserinfo() {
    const relay = new WebSocket('wss://relay.nostr.band');

    let id = Math.floor(Math.random() * 10);

    relay.onopen = function (event) {
        relay.send('["REQ", "' + id + '", {"kinds": [0], "authors": ["' + pubkey + '"]}]');
    };
    relay.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data[0] === "EVENT") {
            console.log(data[2].content)
            const username = JSON.parse(data[2].content)['username'];
            const displayName = JSON.parse(data[2].content)['displayName'];
            const about = JSON.parse(data[2].content)['about'];
            const picture = JSON.parse(data[2].content)['picture'];
            const lightningAddress = JSON.parse(data[2].content)['lud16'];
            const website = JSON.parse(data[2].content)['website'];
            document.title = `${displayName} (@${username})`;
            document.getElementById('header-title').innerHTML = `${displayName}`;
            // document.getElementById('username').innerHTML = `${displayName}`;
            document.getElementById('about').innerHTML = `${about}`;
            document.getElementById('about').style = "";
            document.getElementById('picture').src = `${picture}`;
            document.getElementById('picture').style = "";
            document.getElementById('lud16').innerHTML = `⚡️ ${lightningAddress}`;
            document.getElementById('lud16').style = "";
            document.getElementById('website').innerHTML = `🌎 ${website}`;
            document.getElementById('website').href = `${website}`;
            document.getElementById('website').style = "";
        } else if (data[0] === "EOSE") {
            relay.close();
        }
    }
}

async function nostrGetPosts() {
    const relay = new WebSocket('wss://relay.nostr.band');

    let id = Math.floor(Math.random() * 10);

    relay.onopen = function (event) {
        relay.send('["REQ", "' + id + '", {"kinds": [1], "authors": ["' + pubkey + '"], "limit": 10}]');
    };
    relay.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data[0] === "EVENT") {
            console.log(data[2].content)

            const content = data[2].content;

            var divCol = document.createElement('div');
            divCol.setAttribute('class', 'col');
            var divCard = document.createElement('div');
            divCard.setAttribute('class', 'card shadow-sm');
            var divCardBody = document.createElement('div');
            divCardBody.setAttribute('class', 'card-body');
            var pCardText = document.createElement('p');
            pCardText.setAttribute('class', 'card-text');
            pCardText.innerHTML = content;
            var smallText = document.createElement('small');
            smallText.setAttribute('class', 'text-body-secondary');
            smallText.innerHTML = "formattedTime";
        
            var smallTextId = document.createElement('small');
            smallTextId.setAttribute('class', 'text-body-secondary');
            smallTextId.innerHTML = "id";

            divCardBody.appendChild(pCardText);
            // divCardBody.appendChild(smallTextId);
            // divCardBody.appendChild(smallText);
        
            divCard.appendChild(divCardBody);
            divCol.appendChild(divCard);
            document.getElementById('content').appendChild(divCol);
        } else if (data[0] === "EOSE") {
            relay.close();
        }
    }
}