function load() {
    return new Promise(function (resolve) {
        if (document.readyState == 'complete') {
            resolve();
        } else {
            window.onload = resolve;
        }
    });
}

function auth() {
    VK.init({
        apiId: 6493463
    });

    return new Promise((resolve, reject) => {
        VK.Auth.login(function (response) {
            if (response.session) {
                resolve(response);
            } else {
                reject(new Error('Auth failed'));
            }
        }, 2);
    });
}

function callApi(method, params) {
    params.v = '5.78';

    return new Promise((resolve, reject) => {
        VK.api(method, params, (data) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        })
    });
}

function storeFriends(allFriendsArray) {
    let selectedFriendsArray = [];
    let allFriendsList = document.querySelector('#allFriends');
    let selectFriendsList = document.querySelector('#selectFriends');
    let source = friendTemplate.innerHTML;
    let render = Handlebars.compile(source);

    // Load all friends from local storage if exists
    if (localStorage.getItem('allFriends')) {
        allFriendsArray = JSON.parse(localStorage.getItem('allFriends'));
    }
    let allFriendsHtml = render(allFriendsArray);
    allFriendsList.innerHTML += allFriendsHtml;

    // Load selected friends from local storage if exists
    if (localStorage.getItem('selectFriends')) {
        selectedFriendsArray = JSON.parse(localStorage.getItem('selectFriends'));
        let selectedFriendsHtml = render(selectedFriendsArray);
        selectFriendsList.innerHTML += selectedFriendsHtml;
    }


    // Filtering
    document.addEventListener('input', check);

    function check(e) {
        if (!e.target.tagName === 'INPUT') {
            return false;
        }

        if (e.target.dataset.list === 'allFriends') {
            searchIn(allFriendsList, allFriendsArray, e.target.value);
        } else if (e.target.dataset.list === 'selectFriends') {
            searchIn(selectFriendsList, selectedFriendsArray, e.target.value);
        }
    }

    function searchIn(list, obj, input) {
        for (let i = 0; i < list.children.length; ++i) {
            list.children[i].style.display = 'none';
        }

        for (let item of obj) {
            if ((input !== '' && findPartial(item.first_name, item.last_name, input))
                || (input === '')) {
                document.getElementById(item.id).style.display = 'block';
            }
        }
    }

    function findPartial(firstname, lastname, search) {
        if ((firstname + ' ' + lastname).toLowerCase().indexOf(search.toLowerCase().trim()) >= 0) {
            return true;
        }

        return false;
    }


    // Drag and drop
    allFriends.addEventListener('dragstart', handleDragStart, false);
    selectFriends.addEventListener('dragenter', handleDragEnter, false)
    selectFriends.addEventListener('dragover', handleDragOver, false);
    selectFriends.addEventListener('dragleave', handleDragLeave, false);
    selectFriends.addEventListener('drop', handleDrop, false);


    function handleDragStart(e) {
        if (e.target.tagName == "LI") {
            e.target.style.backgroundColor = '#ccc';
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text', e.target.id);

            return true;
        }
    }

    function handleDragEnter(e) {
        e.target.classList.add('over');
    }

    function handleDragLeave(e) {
        e.target.classList.remove('over');
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        return false;
    }

    function handleDrop(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        let data = e.dataTransfer.getData("text");
        
        document.getElementById(data).style.backgroundColor = '#fff';
        addToArray(data, selectedFriendsArray);
        removeFromArray(data, allFriendsArray);
        selectFriendsList.appendChild(document.getElementById(data));
        document.getElementById(data).setAttribute('draggable', false);
        e.stopPropagation();

        return false;
    }


    // Manage friend lists
    function addToArray(data, array) {
        debugger;
        let friend = {};
        friend.id = document.getElementById(data).id
        friend.first_name = document.getElementById(data).dataset.firstname;
        friend.last_name = document.getElementById(data).dataset.lastname;
        friend.photo_50 = document.getElementById(data).dataset.photo;
        array.push(friend);
    }

    function removeFromArray(data, array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].id === data) {
                debugger;
                array = array.splice(i, 1);
            }
        }
    }


    // Handle clicks
    document.addEventListener('click', habdleClick);

    function habdleClick(e) {
        let target = e.target;
        if (target.className === 'add') {
            let data = target.closest('li').getAttribute('id');

            addToArray(data, selectedFriendsArray);
            removeFromArray(parseInt(data), allFriendsArray);
            selectFriendsList.appendChild(document.getElementById(data));
            document.getElementById(data).setAttribute('draggable', false);
        } else if (target.className === 'delete') {
            let data = target.closest('li').getAttribute('id');

            removeFromArray(data, selectedFriendsArray)
            addToArray(data, allFriendsArray);
            allFriendsList.appendChild(document.getElementById(data));
            document.getElementById(data).setAttribute('draggable', true);
        } else if (target.id === 'btnSave') {
            localStorage.setItem("allFriends", JSON.stringify(allFriendsArray));
            localStorage.setItem("selectFriends", JSON.stringify(selectedFriendsArray));
        }
    }
}

(async () => {
    try {
        await load();
        await auth();

        friends = await callApi('friends.get', { 'fields': 'photo_50', 'v': 5.78 });
        storeFriends(friends.items);
    } catch (e) {
        console.error('Exception raised', e);
    }
})();