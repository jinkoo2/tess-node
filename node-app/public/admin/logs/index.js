
let api_url = `http://${window.location.host}/api/v1`;

let filter = {
    message: "",
    level: "",
    email: "",
    user_ip: "",
}

class Pagenation {
    constructor() {
        this.page = 0;
        this.items_per_page = 10;
        //this.num_of_items = null;
    }

    lastPage() {
        if (this.num_of_items === undefined)
            return 0;

        return Math.floor(this.num_of_items / this.items_per_page)
    }

    gen_control_html() {

        let html = `<nav aria-label="Page navigation example">
                        <ul class="pagination justify-content-center">

                            <li class="page-item {{first-class}}" id="first">
                                <button type="button" class="page-link btn btn-sm btn-link" onclick="on_first_clicked()" tabindex="-1"><<</button>
                            </li>
                            <li class="page-item {{prev-class}}" id="prev">
                                <button type="button" class="page-link btn btn-sm btn-link" onclick="on_prev_clicked()" tabindex="-1"><</button>
                            </li>
                            
                            {{buttons_list}}
                            
                            <li class="page-item {{next-class}}" id="next">
                                <button type="button" class="page-link btn btn-sm btn-link" onclick="on_next_clicked()" >></button>
                            </li>
                            <li class="page-item {{last-class}}" id="last">
                                <button type="button" class="page-link btn btn-sm btn-link" onclick="on_last_clicked()" tabindex="-1">>></button>
                            </li>
                        </ul>
                    </nav>`

        console.log('this', this)

        // first button
        if (this.page === 0)
            html = html.replace("{{first-class}}", "disabled")
        else
            html = html.replace("{{first-class}}", "")

        // prev button
        if (this.page === 0)
            html = html.replace("{{prev-class}}", "disabled")
        else
            html = html.replace("{{prev-class}}", "")

        // bext button
        if (this.page === this.lastPage())
            html = html.replace("{{next-class}}", "disabled")
        else
            html = html.replace("{{next-class}}", "")

        // last button
        if (this.page === this.lastPage())
            html = html.replace("{{last-class}}", "disabled")
        else
            html = html.replace("{{last-class}}", "")


        // make 5 buttons around the page
        let buttons_list = ""
        const last_page_num = this.lastPage() + 1;
        for (var i = -2; i <= 2; i++) {
            const page_num = this.page + i + 1;

            if (page_num > 0 && page_num <= last_page_num) {
                if (i === 0) // active button (current page)
                    buttons_list += `
                        <li class="page-item">
                            <button type="button" class="page-link btn btn-sm btn-link bold disabled">${page_num}</button>
                        </li>`
                else
                    buttons_list += `
                        <li class="page-item">
                            <button type="button" class="page-link btn btn-sm btn-link" onclick="on_pagenation_button_clicked(this)">${page_num}</button>
                        </li>`
            }
        }

        html = html.replace("{{buttons_list}}", buttons_list)

        return html;
    }
}

let pagenation = new Pagenation()
let logs = null;



function _(id) {
    return document.getElementById(id)
}

window.onload = () => {

    _("date-range-checkbox").onchange = (e) => {

        if (e.target.checked) {
            _("date-from-input").disabled = false;
            _("date-to-input").disabled = false;

            _("date-from-input").value = "";
            _("date-to-input").value = "";
        }
        else {
            _("date-from-input").disabled = true;
            _("date-to-input").disabled = true;
        }

        fetch_logs()
    }

    _("date-from-input").onchange = (e) => {
        fetch_logs()
    }

    _("date-to-input").onchange = (e) => {
        fetch_logs()
    }

    // on submit
    fetch_myinfo()
    fetch_logs()
}

function on_pagenation_button_clicked(element) {
    const page_num = parseInt(element.innerHTML)
    console.log('page_num', page_num)

    pagenation.page = page_num - 1;
    fetch_logs();
}

function on_first_clicked() {
    if (pagenation.page === 0)
        return;
    pagenation.page = 0;
    fetch_logs();
}

function on_last_clicked() {
    if (pagenation.page === pagenation.lastPage())
        return;
    pagenation.page = pagenation.lastPage();
    fetch_logs();
}

function on_prev_clicked() {
    if (pagenation.page === 0)
        return;
    pagenation.page -= 1;
    fetch_logs();
}

function on_next_clicked() {
    if (pagenation.page === pagenation.lastPage())
        return;

    pagenation.page += 1;
    fetch_logs();
}

function toDate(date_input_value) {
    const YYYY_MM_DD = date_input_value;
    const yyyy = parseInt(YYYY_MM_DD.split('-')[0])
    const mm = parseInt(YYYY_MM_DD.split('-')[1])
    const dd = parseInt(YYYY_MM_DD.split('-')[2])
    return new Date(yyyy, mm - 1, dd)
}

function fetch_myinfo() {

    console.log('fetching my info')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        show_error('Don\'t have a token yet? Please register!')
        return;
    }

    // fetch user data.
    const inputs =
    {
        user_token,
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
function fetch_logs() {

    console.log('fetch_logs')

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const user_token = urlParams.get("user_token");

    if (!user_token) {
        // user token is not given. So, take the user to the registration page.
        alert('No token provide. Please register!')
        return;
    }

    let inputs =
    {
        user_token,
        skip: pagenation.page * pagenation.items_per_page,
        limit: pagenation.items_per_page,
        filter,
    }

    // inject date range to inputs.filter
    const checkbox = _("date-range-checkbox");
    const from = _("date-from-input")
    const to = _("date-to-input")
    if (checkbox.checked && from.value && to.value) {

        let t0 = toDate(from.value)
        let t1 = toDate(to.value)

        t1.setHours(23)
        t1.setMinutes(59)
        t1.setSeconds(59)

        inputs.filter = { ...filter, date_start: t0, date_end: t1 }
    }

    console.log('=============================')
    console.log('inputs.filter', inputs.filter)
    console.log('=============================')

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url + "/logs", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var { totalCount, list } = JSON.parse(xhr.response);

            // set global variables
            pagenation.num_of_items = totalCount;
            logs = list;

            console.log('pagenation', pagenation)

            console.log('logs', logs)

            polulate_log_list(list)

            // update pagenation control
            _("pagenation").innerHTML = pagenation.gen_control_html();
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}

function polulate_log_list(logs) {
    _("log-list").innerHTML = "";
    logs.forEach(log => add_log(_("log-list"), log))
}

function show_error(msg) {
    _("error").innerHTML = msg;
}

function show_message(msg) {
    _("status").innerHTML = msg;
}

function _dstr(dt_string) {
    return new Date(dt_string).toLocaleString()
}

function _dnum(num, prec) {
    return num.toFixed(prec)
}

function set_active_log(log_id) {

    // find the log of the given id
    const list = logs.filter(log => log._id === log_id)
    if (list.length === 1) {
        const log = list[0]
        $('#json-renderer').jsonViewer(log);
    }
    else if (list.length === 0)
        alert('No log found of the given id!')
    else
        alert('More than 1 logs found of the given log id!')
}

function add_log(parent, log) {

    //const email = (log.meta && log.meta.session && log.meta.session.email) ? log.meta.session.email : "";
    const user_ip = (log.user_ip) ? (log.user_ip) : "";
    const email = (log.email) ? (log.email) : "";
    const level = (log.level) ? (log.level) : "";
    const msg = (log.message.length > 20) ? log.message.substring(0, 20) + "..." : log.message;
    let item = `
    <tr>
        <td scope="row">${_dstr(log.timestamp)}</td>
        <td>${level}</td>
        <td>${msg}</td>
        <td>${email}</td>
        <td>${user_ip}</td>
        <td><button type="button" class="btn btn-link" data-toggle="modal" data-target="#exampleModalCenter" onmouseover="set_active_log('${log._id}')">Details...</button></td>
    </tr>
    `

    parent.innerHTML += item;
}

var timerForMessageInput;
function on_change_message_filter(element) {

    // if needed clear the time out
    if (timerForMessageInput)
        clearTimeout(timerForMessageInput)

    // excute after 2 seconds
    timerForMessageInput = setTimeout(() => {
        filter.message = element.value;

        fetch_logs()
    }, 1000) // excute after two seconds
}

function on_change_level_filter(element) {
    filter.level = element.value;
    fetch_logs()
}

var timerForEmailInput;
function on_change_email_filter(element) {
    // if needed clear the time out
    if (timerForEmailInput)
        clearTimeout(timerForEmailInput)

    // excute after 2 seconds
    timerForEmailInput = setTimeout(() => {
        filter.email = element.value;

        fetch_logs()
    }, 1000) // excute after two seconds
}

function on_change_ip_filter(element) {
    filter.user_ip = element.value;
    fetch_logs()
}

function on_change_data_start_filter(element) {
    console.log('on_change_data_start_filter', element.value)
}

function on_change_data_end_filter(element) {
    console.log('on_change_data_end_filter', element.value)
}

