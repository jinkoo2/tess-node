
var api_url = `http://${window.location.host}/api/v1`;

function _(id) {
    return document.getElementById(id)
}

window.onload = () => {
    // on submit
    fetch_myinfo()
    fetch_users()
}

function fetch_myinfo() {

    console.log('fetching my info')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        show_error('No Token Yet? Please register!')
        return;
    }

    // fetch user data.
    const inputs =
    {
        user_token
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/users/my_info", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            const user = data.data;

            // user 
            _("user_name").innerHTML = user.name;
            _("user_email").innerHTML = user.email;

            // save the user to the document object
            document.user = user;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}

function calculate_OCR_states_user(user) {

    user.num_reqs = 0;
    user.num_pages = 0;
    user.num_words = 0;
    user.total_mbyte = 0;
    user.total_sec = 0;

    user.apps.forEach(app => {
        user.num_reqs += app.num_reqs;
        user.num_pages += app.num_pages;
        user.num_words += app.num_words;
        user.total_mbyte += app.total_mbyte;
        user.total_sec += app.total_sec;
    })
}

function calculate_OCR_states(users) {
    users.forEach(user => calculate_OCR_states_user(user))
}

function fetch_users() {

    console.log('fetch_users')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");


    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        console.error('No user_token!')
        show_error('Don\'t have a token yet? Please register!')
        return;
    }


    // fetch user data.
    const inputs =
    {
        user_token
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/admin/users", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var users = JSON.parse(xhr.response);

            console.log('users', users)

            // update OCR states
            calculate_OCR_states(users);

            polulate_user_list(users)

            // save the user to the document object
            document.users = users;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}


function polulate_user_list(users) {
    _("user-list").innerHTML = "";
    users.forEach(user => add_user(_("user-list"), user))
}

function show_error(msg) {
    _("error").innerHTML = msg;
}

function show_message(msg) {
    _("status").innerHTML = msg;
}

function _dstr(dt_string) {
    return new Date(dt_string).toLocaleDateString()
}

function _dnum(num, prec) {
    return num.toFixed(prec)
}

function add_user(parent, user) {

    let item = `
        <div class="card">
            <div class="card-header">
                    <b {{user_name_class}}>${user.name}</b> 
                 [<button type="button" class="btn btn-link" data-user-email="${user.email}" onclick="on_user_status_change_clicked(this)">${(user.active) ? "Disable" : "Enable"}</button>]
            </div>

            <div class="card-body">
                <p class="card-text">Email: ${user.email}</p>
                <p class="card-text">Status: ${user.active}</p>
            </div >
            <div class="card-footer text-muted">
            ${user.apps.length} apps, ${user.num_reqs} requests, ${user.num_pages} pages, ${user.num_words} words, ${_dnum(user.total_mbyte, 1)} BM, ${_dnum(user.total_sec, 1)} sec, ${_dnum(user.total_sec / user.num_reqs, 2)} sec/req
            </div>
        </div >`

    // add disabled to the class if not active
    const replace_with = (!user.active) ? 'class="disabled"' : "";
    item = item.replace("{{user_name_class}}", replace_with)

    parent.innerHTML += item;
}

function on_user_status_change_clicked(target) {

    console.log('on_user_status_change_clicked user')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        show_error('No Token Yet? Please register!')
        return;
    }

    // inputs
    const inputs =
    {
        user_token,
        user_email: target.dataset.userEmail
    }

    if (inputs.user_email === document.user.email) {
        alert("You cannot change your own status")
        return;
    }
    console.log(inputs)

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/admin/toggle_user_status", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            // update 
            fetch_users()
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')

}