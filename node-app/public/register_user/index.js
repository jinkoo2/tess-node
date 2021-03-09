var api_url = "http://localhost:3333/api/v1/users/register";

function _(id) {
    return document.getElementById(id)
}

window.onload = () => {
    // on submit
    _('myform').addEventListener('submit', onSubmit, false);
}
function onSubmit(ev) {

    ev.preventDefault();

    const inputs =
    {
        name: _("name").value,
        email: _("email").value
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);

            console.log('data', data)

            if (data.success)
                _("output_text").innerHTML = 'Success';
            else
                _("output_text").innerHTML = 'Failed';

            _("output_json").innerHTML = data.message;
        }
    }

    xhr.send(JSON.stringify(inputs));

    console.log('req sent!')
}



function ocr() {

    var formData = new FormData();
    formData.append("img_data", fileToUpload);
    formData.append("lang", "eng");
    formData.append("token", "Your-API-Key-Here");
    formData.append("isOverlayRequired", True);

    console.log(formData)
}