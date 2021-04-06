function _(id) {
    return document.getElementById(id)
}

function is_validate_email(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function error(msg) {
    //alert(msg)

    _("dlgBody").innerHTML = msg;
    _("dlgTitle").innerHTML = 'Error';

    $("#show-dlg-button").click()
}