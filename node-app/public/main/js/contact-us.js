
window.addEventListener('load', (event) => {
    // on submit
    _('contact_us_form').addEventListener('submit', onSubmitContactUs, false);

    console.log('contact-us.window.onload executed...')
});

function onSubmitContactUs(ev) {

    $("form[name='contact_us_form']").val



    ev.preventDefault();

    const inputs =
    {
        name: _("contact_us_name").value,
        email: _("contact_us_email").value,
        subject: _("contact_us_subject").value,
        msg: _("contact_us_msg").value,
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

    // subject
    if (!inputs.subject || inputs.subject.trim().length < 1) {
        error('Please enter Subject');
        return;
    }
    // name
    if (!inputs.msg || inputs.msg.trim().length < 1) {
        error('Please enter Message');
        return;
    }


    var xhr = new XMLHttpRequest();
    xhr.open("POST", contact_us_api_url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            if (data.success) {
                _("contact_us_output_text").innerHTML = 'Form Submitted!';

                _("contact_us_name").value = "";
                _("contact_us_email").value = "";
                _("contact_us_subject").value = "";
                _("contact_us_msg").value = "";

            }
            else
                _("contact_us_output_text").innerHTML = data.message;

            //_("output_json").innerHTML = data.message;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}
