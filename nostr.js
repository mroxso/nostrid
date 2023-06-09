// const urlParams = new URLSearchParams(window.location.search);
// let pubkey = urlParams.get('pubkey');
// if(pubkey == null) {
//     // pubkey = window.location.pathname.substr(1);
//     pubkey = window.location.pathname.substring(1);
//     if(pubkey == "") {
//         // CHANGE THIS TO YOUR OWN PUBLIC KEY (HEX FORMAT)
//         pubkey = "480ec1a7516406090dc042ddf67780ef30f26f3a864e83b417c053a5a611c838"
//     }
// }

let userPubkey = window.localStorage.getItem("userPubkey");

const pool = new window.NostrTools.SimplePool();
let relays = ["wss://relay.nostr.band"];

let pubkey = window.location.href.split("/").pop();
if (pubkey.startsWith("npub")) {
    pubkey = window.NostrTools.nip19.decode(pubkey).data;
}

async function nostrLogin() {
    let publicKey = await window.nostr.getPublicKey();
    console.log("Public Key: " + publicKey);
    let publicKeyEncoded = window.NostrTools.nip19.npubEncode(publicKey);
    window.location.href = `/${publicKeyEncoded}`
    userPubkey = publicKey;
    window.localStorage.setItem("userPubkey", userPubkey);
    nostrGetLoginInfo();
    return publicKey;
}

function nostrLogout() {
    window.localStorage.clear();
}

async function nostrGetLoginInfo() {
    let sub = pool.sub([...relays], [
        {
            kinds: [0],
            authors: [pubkey],
            limit: 1
        }
    ])
    sub.on('event', data => {
        // console.log(data.content)
        const username = JSON.parse(data.content)['username'];
        const displayName = JSON.parse(data.content)['displayName'];
        const name = JSON.parse(data.content)['name'];
        const about = JSON.parse(data.content)['about'];
        const picture = JSON.parse(data.content)['picture'];
        const lightningAddress = JSON.parse(data.content)['lud16'];
        const website = JSON.parse(data.content)['website'];

        window.localStorage.setItem("about", about);
        window.localStorage.setItem("picture", picture);
        window.localStorage.setItem("lightningAddress", lightningAddress);
        window.localStorage.setItem("website", website);

        if (typeof displayName !== "undefined") {
            window.localStorage.setItem("name", displayName);
        } else if (typeof name !== "undefined") {
            window.localStorage.setItem("name", name);
        } else {
            window.localStorage.setItem("name", username);
        }
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}

async function nostrGetUserinfo() {
    let sub = pool.sub([...relays], [
        {
            kinds: [0],
            authors: [pubkey],
            limit: 10
        }
    ])
    sub.on('event', data => {
        // console.log(data.content)
        const username = JSON.parse(data.content)['username'];
        const displayName = JSON.parse(data.content)['displayName'];
        const name = JSON.parse(data.content)['name'];
        const about = JSON.parse(data.content)['about'];
        const picture = JSON.parse(data.content)['picture'];
        const lightningAddress = JSON.parse(data.content)['lud16'];
        const website = JSON.parse(data.content)['website'];

        if (typeof displayName !== "undefined") {
            document.getElementById('header-title').innerHTML = `${displayName}`;
            document.title = `${displayName}`;
        } else if (typeof name !== "undefined") {
            document.getElementById('header-title').innerHTML = `${name}`;
            document.title = `${name}`;
        } else {
            document.getElementById('header-title').innerHTML = `${username}`;
            document.title = `${username}`;
        }
        if (typeof name !== "undefined" && typeof username !== "undefined") {
            document.title = `${name} (@${username})`;
        }
        document.getElementById('about').innerHTML = `${about}`;
        if (about != "")
            document.getElementById('about').style = "";
        document.getElementById('picture').src = `${picture}`;
        if (picture != "")
            document.getElementById('picture').style = "";
        document.getElementById('lud16').innerHTML = `⚡️ ${lightningAddress}`;
        if (lightningAddress != "")
            document.getElementById('lud16').style = "";
        document.getElementById('website').innerHTML = `🌎 ${website}`;
        document.getElementById('website').href = `${website}`;
        if (website != "")
            document.getElementById('website').style = "";
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}


async function nostrGetPosts() {
    let sub = pool.sub([...relays], [
        {
            kinds: [1],
            authors: [pubkey],
        }
    ])
    sub.on('event', data => {
        // Only show posts without tags (no replies, etc.)
        // if(data.tags.length != 0) {
        //     return;
        // }

        // console.log(data.tags)

        // Only show posts without tags (no replies, etc.)
        for(var i = 0; i < data.tags.length; i++) {
            if(data.tags[i][0] == "p" || data.tags[i][0] == "e") {
                return;
            }
        }

        const content = data.content;
        const formattedTime = new Date(data.created_at*1000).toLocaleString();
        const id = data.id;
        
        var divCol = document.createElement('div');
        divCol.setAttribute('class', 'col');
        
        var divCard = document.createElement('div');
        divCard.setAttribute('class', 'card shadow-sm');
        
        var divCardBody = document.createElement('div');
        divCardBody.setAttribute('class', 'card-body');
        
        var pCardText = document.createElement('p');
        pCardText.setAttribute('class', 'card-text');
        pCardText.innerHTML = content;
        
        var smallTime = document.createElement('small');
        smallTime.setAttribute('class', 'text-body-secondary');
        smallTime.innerHTML = formattedTime;
        
        // var smallId = document.createElement('small');
        // smallId.setAttribute('class', 'text-body-secondary');
        // smallId.innerHTML = id;
        
        divCardBody.appendChild(pCardText);
        divCardBody.appendChild(smallTime);
        // divCardBody.appendChild(smallId);
        
        divCard.appendChild(divCardBody);
        divCol.appendChild(divCard);
        
        document.getElementById('content').appendChild(divCol);
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}

function search() {
    let search = document.getElementById('searchbox')
    window.location.href = `/${search.value}`
}

async function fetchTrendingProfilesFromNostrBand() {
    const response = await fetch('https://api.nostr.band/v0/trending/profiles')
    const jsonData = await response.json()

    // console.log(jsonData['profiles'])

    let i = 0;
    // while(i < jsonData['profiles'].length) {
    while(i < 8) {
        const profile = jsonData['profiles'][i]
        const pubkey = profile['pubkey']
        const pubkeyEncoded = window.NostrTools.nip19.npubEncode(pubkey)
        const newFollowersCount = profile['new_followers_count']
        const profileContent = JSON.parse(profile['profile']['content'])
        const name = profileContent.name
        const about = profileContent.about
        const picture = profileContent.picture

        // console.log(profileContent)

        // console.log("====================================")
        // console.log(profile)
        // console.log(pubkey)
        // console.log(newFollowersCount)
        // console.log(name)
        // // console.log("-->" + JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(profile['profile']))['content'])['name']))
        // console.log("====================================")

        // create div element with class "row g-2" and id "trendingCards"
        var divTrendingCards = document.getElementById("trendingCards");

        // create div element with class "card m-2" and style "width: 18rem;"
        var divCard = document.createElement("div");
        divCard.setAttribute("class", "card m-2 mx-auto d-flex flex-column");
        divCard.setAttribute("style", "width: 18rem;");

        // create img element with src "https://via.placeholder.com/150" and class "card-img-top" with alt "..."
        var imgCard = document.createElement("img");
        let imgSrc = `https://robohash.org/${pubkeyEncoded}`;
        if(picture != null) {
            imgSrc = picture;
        }
        imgCard.setAttribute("src", imgSrc);
        imgCard.setAttribute("class", "card-img-top");
        imgCard.setAttribute("alt", "...");

        // create div element with class "card-body"
        var divCardBody = document.createElement("div");
        divCardBody.setAttribute("class", "card-body");

        // create h5 element with class "card-title" and inner text "Card title"
        var h5CardTitle = document.createElement("h5");
        h5CardTitle.setAttribute("class", "card-title");
        h5CardTitle.innerText = name;

        // create p element with class "card-text" and inner text "Some quick example text to build on the card title and make up the bulk of the card's content."
        var pCardText = document.createElement("p");
        pCardText.setAttribute("class", "card-text");
        pCardText.innerText = about;

        // create a element with class "btn btn-primary" and inner text "Go somewhere" with href "#"
        var aBtnPrimary = document.createElement("a");
        aBtnPrimary.setAttribute("href", `/${pubkeyEncoded}`);
        aBtnPrimary.setAttribute("class", "btn btn-primary align-self-end");
        aBtnPrimary.innerText = "View Profile";

        // append child elements to parent elements
        divCardBody.appendChild(h5CardTitle);
        divCardBody.appendChild(pCardText);
        divCardBody.appendChild(aBtnPrimary);
        divCard.appendChild(imgCard);
        divCard.appendChild(divCardBody);
        divTrendingCards.appendChild(divCard);

        i++;
    }

    // console.log(jsonData)
    // return jsonData
}