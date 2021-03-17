
var api_url = `http://${window.location.host}/api/v1`;


function _(id) {
    return document.getElementById(id)
}


window.onload = () => {
    // on submit
    fetch_user()

    // register app button onclick event
    _('register_app').addEventListener('click', on_register_app_clicked);
}



function fetch_user() {

    console.log('fetching user')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        alert('No token provide. Please register!')
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

            var user = JSON.parse(xhr.response);

            console.log('data', user)

            // user 
            _("user_name").innerHTML = user.name;
            _("user_email").innerHTML = user.email;

            // populate app list
            if (user.apps.length > 0) {
                _("applications-container").style.display = "block";
                polulate_app_list(user.apps)
            }
            else {
                _("applications-container").style.display = "none";
            }

            // save the user to the document object
            document.user = user;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}

function polulate_app_list(apps) {
    _("app-list").innerHTML = "";
    apps.forEach(app => add_app(_("app-list"), app))
}

function _dstr(dt_string) {
    return new Date(dt_string).toLocaleDateString()
}

function _dnum(num, prec) {
    return num.toFixed(prec)
}

function on_app_status_change_clicked(target) {

    console.log('on_app_status_change_clicked user')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        alert('No token provide. Please register!')
        return;
    }

    // inputs
    const inputs =
    {
        user_token,
        app_name: target.dataset.appName
    }

    console.log(inputs)

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/apps/toggle_status", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            // update 
            fetch_user()
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')

}

function add_app(parent, app) {
    let item = `
        <div class="card">
            <div class="card-header">
                    <b {{app_name_class}}>${app.name}</b> 
                 [<button type="button" class="btn btn-link" data-app-name="${app.name}" onclick="on_app_status_change_clicked(this)">${(app.active) ? "Disable" : "Enable"}</button>]
            </div>

            <div class="card-body">
                <p class="card-text">${app.token}</p>
            </div >
            <div class="card-footer text-muted">
                ${app.num_reqs} requests, ${app.num_pages} pages, ${app.num_words} words, ${_dnum(app.total_mbyte, 1)} BM, ${_dnum(app.total_sec, 1)} sec, ${_dnum(app.total_sec / app.num_reqs, 2)} sec/req
            </div>

        </div >`

    // add disabled to the class if not active
    const replace_with = (!app.active) ? 'class="disabled"' : "";
    item = item.replace("{{app_name_class}}", replace_with)

    parent.innerHTML += item;
}

function show_error(msg) {
    _("error").innerHTML = msg;
}

function show_message(msg) {
    _("status").innerHTML = msg;
}

function on_register_app_clicked(e) {

    ///////////////
    // user_token
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");
    if (!user_token || user_token.length < 5) {
        error('Invalid user token')
        return;
    }

    ///////////////
    // app_name
    const app_name = _("app_name").value;
    if (!app_name || app_name.length < 3 || app_name.length > 30) {
        error('Invalid applciation name. It must be between 3-30 charactors')
        return;
    }

    const inputs =
    {
        app_name,
        user_token
    }

    console.log('inputs', inputs)
    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/apps/register", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            if (data && data.success) {

                fetch_user()

                show_message("Registration success!")
            }
            else {
                show_error("Registration failed!" + data.show_message)
            }
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}
