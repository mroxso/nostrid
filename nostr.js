async function nostrGetUserinfo() {
    // CHANGE THIS TO YOUR OWN PUBLIC KEY (HEX FORMAT)
    const pubkey = "480ec1a7516406090dc042ddf67780ef30f26f3a864e83b417c053a5a611c838"

    const relay = new WebSocket('wss://relay.nostr.band');
    let name = "";
    
    let id = Math.floor(Math.random() * 10);

    relay.onopen = function(event) {
        relay.send('["REQ", "'+id+'", {"kinds": [0], "authors": ["'+pubkey+'"]}]'); // TODO: Build correct Request
    };
    relay.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data[0] === "EVENT") {
            console.log(data[2].content)
            const username = JSON.parse(data[2].content)['username'];
            const displayName = JSON.parse(data[2].content)['displayName'];
            const about = JSON.parse(data[2].content)['about'];
            const picture = JSON.parse(data[2].content)['picture'];
            document.getElementById('header-title').innerHTML = `${displayName}`;
            document.getElementById('username').innerHTML = `${displayName}`;
            document.getElementById('about').innerHTML = `${about}`;
            document.getElementById('picture').src = `${picture}`;
        } else if (data[0] === "EOSE") {
            relay.close();
        }
    }
}