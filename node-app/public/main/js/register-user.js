window.addEventListener('load', (event) => {
    // on submit
    _('register_user_form').addEventListener('submit', onSubmitRegisterUser, false);

    console.log('register-user.window.onload executed...')
});

function onSubmitRegisterUser(ev) {


    ev.preventDefault();

    const inputs =
    {
        name: _("register_user_name").value,
        email: _("register_user_email").value
    }

    ////////////////////
    // validate inputs

    // name
    if (!inputs.name || inputs.name.trim().length < 1) {
        error('Please enter name');
        return;
    }

    // email
    if (!is_validate_email(inputs.email)) {
        error('Please enter valid email');
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", register_user_api_url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            if (data.success) {
                _("register_user_output_text").innerHTML = data.message;

                _("register_user_name").value = ""
                _("register_user_email").value = ""
            }
            else
                _("register_user_output_text").innerHTML = data.message;

            //_("output_json").innerHTML = data.message;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}
