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
// let relays = ["wss://relay.nostr.band", "wss://relay.damus.io", "wss://nostr.wine", "wss://nos.lol", "wss://nostr.mom"];
// let relays = ["wss://relay.damus.io"];
let relays = ["wss://relay.nostr.band"];


let pubkey = ""
let pubkeyEncoded = ""
let note = ""

let loginButton = document.getElementById('nostr-login-button');
let logoutButton = document.getElementById('nostr-logout-button');
let newNoteButton = document.getElementById('nostr-new-note-button');
if(userPubkey != null && loginButton != null) {
    loginButton.style.display = "none";
    logoutButton.style.display = "block";
    newNoteButton.style.display = "block";
}

if (window.location.href.split("/")[3] == 'p') {
    pubkey = window.location.href.split("/").pop();
    if (pubkey.startsWith("npub")) {
        pubkeyEncoded = pubkey;
        pubkey = window.NostrTools.nip19.decode(pubkey).data;
    }
} else if (window.location.href.split("/")[3] == 'n') {
    note = window.location.href.split("/").pop();
    if (note.startsWith("note")) {
        note = window.NostrTools.nip19.decode(note).data;
    }
}

async function nostrLogin() {
    let publicKey = await window.nostr.getPublicKey();
    console.log("Public Key: " + publicKey);
    let publicKeyEncoded = window.NostrTools.nip19.npubEncode(publicKey);
    window.location.href = `/p/${publicKeyEncoded}`
    userPubkey = publicKey;
    window.localStorage.setItem("userPubkey", userPubkey);
    nostrGetLoginInfo();
    return publicKey;
}

function nostrLogout() {
    window.localStorage.clear();
    window.location.href = `/`;
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
        const about = JSON.parse(data.content)['about'].replace(/\r?\n/g, "<br>");;
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
        const about = JSON.parse(data.content)['about'].replace(/\r?\n/g, "<br>");
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
        document.getElementById('header-title-link').href = `/p/${pubkeyEncoded}`;
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}

async function nostrGetPost(note) {
    console.log(note)
    let sub = pool.sub([...relays], [
        {
            kinds: [1],
            ids: [note],
        }
    ])
    sub.on('event', data => {
        console.log(data)
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

        const content = data.content.replace(/\r?\n/g, "<br>");
        const formattedTime = new Date(data.created_at*1000).toLocaleString();
        const id = data.id;
        const encodedNoteId = window.NostrTools.nip19.noteEncode(id);
        
        var divCol = document.createElement('div');
        divCol.setAttribute('class', 'col');
        
        var divCard = document.createElement('div');
        divCard.setAttribute('class', 'card shadow-sm');
        divCard.setAttribute('id', `card-${id}`);

        var divCardBody = document.createElement('div');
        divCardBody.setAttribute('class', 'card-body');
        
        var pCardText = document.createElement('p');
        pCardText.setAttribute('class', 'card-text');
        pCardText.innerHTML = content;
        
        var smallTime = document.createElement('small');
        smallTime.setAttribute('class', 'text-body-secondary');
        smallTime.innerHTML = formattedTime;
        
        // Buttons
        var pButtons = document.createElement('p');
        var btnGroup = document.createElement('div');
        btnGroup.setAttribute('class', 'btn-group');
        btnGroup.setAttribute('role', 'group');
        btnGroup.setAttribute('aria-label', 'note-button-group');
        // Like Button
        var btnLike = document.createElement('button');
        var smallLikes = document.createElement('small');
        smallLikes.setAttribute('class', 'text-body-secondary');
        smallLikes.setAttribute('id', `likes-${id}`);
        smallLikes.innerHTML = "0" + " 👍";
        btnLike.setAttribute('id', `btn-like-${id}`);
        btnLike.setAttribute('class', 'btn btn-sm btn-outline-secondary');
        btnLike.setAttribute('onclick', `nostrLikePost(${id})`);
        btnLike.appendChild(smallLikes);
        
        // Zap Button
        var btnZap = document.createElement('button');
        var smallZap = document.createElement('small');
        smallZap.setAttribute('class', 'text-body-secondary');
        smallZap.setAttribute('id', `zap-${id}`);
        smallZap.innerHTML = "0" + " sats ⚡️";
        btnZap.setAttribute('class', 'btn btn-sm btn-outline-secondary disabled');
        btnZap.setAttribute('onclick', `nostrZapPost(${id})`);
        btnZap.appendChild(smallZap);

        btnGroup.appendChild(btnLike);
        btnGroup.appendChild(btnZap);
        pButtons.appendChild(btnGroup);

        var pId = document.createElement('p');
        var smallId = document.createElement('small');
        smallId.setAttribute('class', 'text-body-secondary');
        smallId.innerHTML = encodedNoteId;
        pId.appendChild(smallId);
        
        divCardBody.appendChild(pCardText);
        divCardBody.appendChild(pButtons);
        divCardBody.appendChild(smallTime);
        divCardBody.appendChild(pId);
        
        divCard.appendChild(divCardBody);
        divCol.appendChild(divCard);
        
        document.getElementById('content').appendChild(divCol);
        nostrGetLikesForPost(id);
        nostrGetZapsForPost(id);
        pubkey = data.pubkey;
        nostrGetUserinfo();
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

    // Sorting logic
    var dataArray = []; // Create an array to store the data

    sub.on('event', data => {
        document.getElementById('notes-loading').style.display = "none";

        dataArray.push(data); // Push each data object into the array

        // -- START UNSORTED LOADING -- //
        // Your existing code to create and append elements goes here
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

        const content = data.content.replace(/\r?\n/g, "<br>");
        const formattedTime = new Date(data.created_at*1000).toLocaleString();
        const id = data.id;
        const encodedNoteId = window.NostrTools.nip19.noteEncode(id);
        
        var divCol = document.createElement('div');
        divCol.setAttribute('class', 'col');
        
        var divCard = document.createElement('div');
        divCard.setAttribute('class', 'card shadow-sm');
        divCard.setAttribute('id', `card-${id}`);
        
        var divCardBody = document.createElement('div');
        divCardBody.setAttribute('class', 'card-body');
        
        var pCardText = document.createElement('p');
        pCardText.setAttribute('class', 'card-text');
        pCardText.innerHTML = content;
        
        var smallTime = document.createElement('small');
        smallTime.setAttribute('class', 'text-body-secondary');
        smallTime.innerHTML = formattedTime;
        
        // Buttons
        var pButtons = document.createElement('p');
        var btnGroup = document.createElement('div');
        btnGroup.setAttribute('class', 'btn-group');
        btnGroup.setAttribute('role', 'group');
        btnGroup.setAttribute('aria-label', 'note-button-group');
        // Like Button
        var btnLike = document.createElement('button');
        var smallLikes = document.createElement('small');
        smallLikes.setAttribute('class', 'text-body-secondary');
        smallLikes.setAttribute('id', `likes-${id}`);
        smallLikes.innerHTML = "0" + " 👍";
        btnLike.setAttribute('id', `btn-like-${id}`);
        btnLike.setAttribute('class', 'btn btn-sm btn-outline-secondary');
        btnLike.setAttribute('onclick', `nostrLikePost(${id})`);
        btnLike.appendChild(smallLikes);
        
        // Zap Button
        var btnZap = document.createElement('button');
        var smallZap = document.createElement('small');
        smallZap.setAttribute('class', 'text-body-secondary');
        smallZap.setAttribute('id', `zap-${id}`);
        smallZap.innerHTML = "0" + " sats ⚡️";
        btnZap.setAttribute('class', 'btn btn-sm btn-outline-secondary disabled');
        btnZap.setAttribute('onclick', `nostrZapPost(${id})`);
        btnZap.appendChild(smallZap);

        btnGroup.appendChild(btnLike);
        btnGroup.appendChild(btnZap);
        pButtons.appendChild(btnGroup);

        var pId = document.createElement('p');
        var aId = document.createElement('a');
        aId.setAttribute('class', 'text-body-secondary');
        aId.setAttribute('href', `/n/${encodedNoteId}`);
        aId.setAttribute('target', '_blank');
        aId.innerHTML = encodedNoteId;
        pId.appendChild(aId);
        
        divCardBody.appendChild(pCardText);
        divCardBody.appendChild(pButtons);
        divCardBody.appendChild(smallTime);
        divCardBody.appendChild(pId);
        
        divCard.appendChild(divCardBody);
        divCol.appendChild(divCard);
        
        document.getElementById('content').appendChild(divCol);
        nostrGetLikesForPost(id);
        nostrGetZapsForPost(id);
        // -- END UNSORTED LOADING -- //
    });

    // After all data has been received (eose event), sort the dataArray and display data
    sub.on('eose', () => {
        // -- START SORTED LOADING -- //
        // dataArray.sort((a, b) => b.created_at - a.created_at);

        // if(dataArray.length != 0) {
        //     document.getElementById('notes-loading').style.display = "none";
        // }

        // // Process the sorted dataArray here
        // dataArray.forEach((data) => {
        //     // Your existing code to create and append elements goes here
        //     // Only show posts without tags (no replies, etc.)
        //     // if(data.tags.length != 0) {
        //     //     return;
        //     // }

        //     // console.log(data.tags)

        //     // Only show posts without tags (no replies, etc.)
        //     for(var i = 0; i < data.tags.length; i++) {
        //         if(data.tags[i][0] == "p" || data.tags[i][0] == "e") {
        //             return;
        //         }
        //     }

        //     const content = data.content.replace(/\r?\n/g, "<br>");
        //     const formattedTime = new Date(data.created_at*1000).toLocaleString();
        //     const id = data.id;
        //     const encodedNoteId = window.NostrTools.nip19.noteEncode(id);
            
        //     var divCol = document.createElement('div');
        //     divCol.setAttribute('class', 'col');
            
        //     var divCard = document.createElement('div');
        //     divCard.setAttribute('class', 'card shadow-sm');
        //     divCard.setAttribute('id', `card-${id}`);
            
        //     var divCardBody = document.createElement('div');
        //     divCardBody.setAttribute('class', 'card-body');
            
        //     var pCardText = document.createElement('p');
        //     pCardText.setAttribute('class', 'card-text');
        //     pCardText.innerHTML = content;
            
        //     var smallTime = document.createElement('small');
        //     smallTime.setAttribute('class', 'text-body-secondary');
        //     smallTime.innerHTML = formattedTime;
            
        //     // Buttons
        //     var pButtons = document.createElement('p');
        //     var btnGroup = document.createElement('div');
        //     btnGroup.setAttribute('class', 'btn-group');
        //     btnGroup.setAttribute('role', 'group');
        //     btnGroup.setAttribute('aria-label', 'note-button-group');
        //     // Like Button
        //     var btnLike = document.createElement('button');
        //     var smallLikes = document.createElement('small');
        //     smallLikes.setAttribute('class', 'text-body-secondary');
        //     smallLikes.setAttribute('id', `likes-${id}`);
        //     smallLikes.innerHTML = "0" + " 👍";
        //     btnLike.setAttribute('id', `btn-like-${id}`);
        //     btnLike.setAttribute('class', 'btn btn-sm btn-outline-secondary');
        //     btnLike.setAttribute('onclick', `nostrLikePost(${id})`);
        //     btnLike.appendChild(smallLikes);
            
        //     // Zap Button
        //     var btnZap = document.createElement('button');
        //     var smallZap = document.createElement('small');
        //     smallZap.setAttribute('class', 'text-body-secondary');
        //     smallZap.setAttribute('id', `zap-${id}`);
        //     smallZap.innerHTML = "0" + " sats ⚡️";
        //     btnZap.setAttribute('class', 'btn btn-sm btn-outline-secondary disabled');
        //     btnZap.setAttribute('onclick', `nostrZapPost(${id})`);
        //     btnZap.appendChild(smallZap);

        //     btnGroup.appendChild(btnLike);
        //     btnGroup.appendChild(btnZap);
        //     pButtons.appendChild(btnGroup);

        //     var pId = document.createElement('p');
        //     var aId = document.createElement('a');
        //     aId.setAttribute('class', 'text-body-secondary');
        //     aId.setAttribute('href', `/n/${encodedNoteId}`);
        //     aId.setAttribute('target', '_blank');
        //     aId.innerHTML = encodedNoteId;
        //     pId.appendChild(aId);
            
        //     divCardBody.appendChild(pCardText);
        //     divCardBody.appendChild(pButtons);
        //     divCardBody.appendChild(smallTime);
        //     divCardBody.appendChild(pId);
            
        //     divCard.appendChild(divCardBody);
        //     divCol.appendChild(divCard);
            
        //     document.getElementById('content').appendChild(divCol);
        //     nostrGetLikesForPost(id);
        //     nostrGetZapsForPost(id);
        // });

        // -- END SORTED LOADING -- //

        sub.unsub();
    });
}

async function nostrGetLikesForPost(id) {
    let userLiked = false;
    let sub = pool.sub([...relays], [
        {
            kinds: [7],
            "#e": [id],
        }
    ])
    sub.on('event', data => {
        // console.log(data)
        const content = data.content;
        const formattedTime = new Date(data.created_at*1000).toLocaleString();
        const reactionId = data.id;

        if(content != "-") {
            likesId = `likes-${id}`;
            btnLikeId = `btn-like-${id}`;
            likesCounter = parseInt(document.getElementById(likesId).innerHTML.split(" ")[0])
            if(data.pubkey == userPubkey || userLiked) {
                // console.log(userPubkey + " liked post with id " + id)
                document.getElementById(btnLikeId).setAttribute('class', 'btn btn-sm btn-outline-success');
                // document.getElementById(likesId).innerHTML = `${likesCounter + 1} 🫂`;
                userLiked = true;
            }
            document.getElementById(likesId).innerHTML = `${likesCounter + 1} 👍`;
        }
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}

async function nostrGetZapsForPost(id) {
    let sub = pool.sub([...relays], [
        {
            kinds: [9735],
            "#e": [id],
        }
    ])
    sub.on('event', data => {
        // console.log(data)
        zapId = `zap-${id}`
        zapCounter = parseInt(document.getElementById(zapId).innerHTML.split(" ")[0])
        const content = data.content;
        const formattedTime = new Date(data.created_at*1000).toLocaleString();
        const reactionId = data.id;
        let sats = 0;
        for(let i = 0; i < data.tags.length; i++) {
            if(data.tags[i][0] == ('bolt11')) {
                bolt11 = data.tags[i][1];
                // Remove first 4 characters i.e. 'lnbc'
                let inputStrWithoutPrefix = bolt11.slice(4);
                // Get the number after 'lnbc'
                let numberAfterPrefix = parseInt(bolt11.slice(4).match(/\d+/)[0]);
                // Get the first letter after the number
                let letterAfterNumber = inputStrWithoutPrefix.charAt(inputStrWithoutPrefix.search(/[a-zA-Z]/));
                if(letterAfterNumber == 'm') {
                    sats = Math.round((numberAfterPrefix * 0.001) * 100000000);
                } else if(letterAfterNumber == 'u') {
                    sats = Math.round((numberAfterPrefix * 0.000001) * 100000000);
                } else if(letterAfterNumber == 'n') {
                    sats = Math.round((numberAfterPrefix * 0.000000001) * 100000000);
                } else if(letterAfterNumber == 'p') {
                    sats = Math.round((numberAfterPrefix * 0.000000000001) * 100000000);
                }
            }
        }

        if(content != "-") {
            document.getElementById(zapId).innerHTML = `${zapCounter + sats} sats ⚡️`
        }

        // colorize note card based on sats received
        colorizeNoteCard(id, zapCounter, sats);
    })
    sub.on('eose', () => {
        sub.unsub()
    })
}

async function colorizeNoteCard(id, zapCounter, sats) {
    // colorize note card based on sats received
    if(zapCounter + sats > 420 && zapCounter + sats < 1337) {
        document.getElementById(`card-${id}`).setAttribute('class', 'card shadow-sm border-info');
    } else if(zapCounter + sats > 1337 && zapCounter + sats < 5000) {
        document.getElementById(`card-${id}`).setAttribute('class', 'card shadow-sm border-warning');
    } else if(zapCounter + sats > 5000 && zapCounter + sats < 10000) {
        document.getElementById(`card-${id}`).setAttribute('class', 'card shadow-sm border-danger');
}
}

function search() {
    let search = document.getElementById('searchbox')
    window.location.href = `/p/${search.value}`
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
        aBtnPrimary.setAttribute("href", `/p/${pubkeyEncoded}`);
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